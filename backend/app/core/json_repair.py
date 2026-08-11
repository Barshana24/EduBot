"""Tolerant extraction of a JSON object from model output.

The model is asked for JSON but can be cut short by an output-token limit,
which leaves an unterminated array. A strict json.loads on that raises and
the whole request fails, throwing away the questions that did arrive. These
helpers salvage every complete item instead.
"""
import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


def _slice_outer_object(text: str) -> Optional[str]:
    """The substring from the first '{' to the matching '}', if it closes."""
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _complete_objects(text: str) -> list[dict[str, Any]]:
    """Every balanced {...} block in `text` that parses on its own."""
    items: list[dict[str, Any]] = []
    depth = 0
    in_string = False
    escaped = False
    start = -1

    for i, ch in enumerate(text):
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start != -1:
                    try:
                        items.append(json.loads(text[start : i + 1]))
                    except json.JSONDecodeError:
                        pass
                    start = -1
    return items


def extract_list(response: str, key: str) -> list[dict[str, Any]]:
    """
    Pull `key`'s list of objects out of a model response.

    Tries a clean parse first. If the response was truncated, falls back to
    collecting the complete objects that follow `"key": [`, so a cut-off
    answer still yields the items that made it through.
    """
    if not response or not response.strip():
        return []

    outer = _slice_outer_object(response)
    if outer:
        try:
            data = json.loads(outer)
            value = data.get(key)
            if isinstance(value, list):
                return [v for v in value if isinstance(v, dict)]
        except json.JSONDecodeError:
            pass

    # Truncated. Salvage whatever complete objects sit inside the array.
    marker = f'"{key}"'
    idx = response.find(marker)
    if idx == -1:
        return []
    bracket = response.find("[", idx)
    if bracket == -1:
        return []

    salvaged = _complete_objects(response[bracket:])
    if salvaged:
        logger.warning(
            "Model response for %r was truncated; salvaged %d complete items",
            key, len(salvaged),
        )
    return salvaged


def is_service_error(response: str) -> bool:
    """
    The Gemini wrapper yields a human-readable warning string rather than
    raising, so an upstream failure arrives here as ordinary text.
    """
    return response.lstrip().startswith("⚠️")
