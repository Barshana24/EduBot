"""Supplementary learning resources: videos, playlists and reference sites.

Every link is built from a platform's own documented search endpoint, so it
resolves for any topic and can never be a dead or invented URL. Nothing here
calls a model: Gemini's Google Search grounding returns 429 on the free tier,
and asking a model for URLs invites hallucinated links.

Each pattern below was checked live and returns HTTP 200. Brilliant (404 on
its search path) and Stack Exchange (bot-blocked) were dropped for that reason.
"""
from urllib.parse import quote_plus
from typing import Optional

# YouTube's "playlist" result filter token.
_PLAYLIST_FILTER = "EgIQAw%253D%253D"


def _yt(query: str) -> str:
    return f"https://www.youtube.com/results?search_query={quote_plus(query)}"


def _yt_playlists(query: str) -> str:
    return f"{_yt(query)}&sp={_PLAYLIST_FILTER}"


# Reference platforms, keyed so subjects can opt into the relevant ones.
_PLATFORMS = {
    "wikipedia": {
        "name": "Wikipedia",
        "blurb": "Definitions, history and the formal statement.",
        "url": lambda q: f"https://en.wikipedia.org/w/index.php?search={quote_plus(q)}",
    },
    "gfg": {
        "name": "GeeksforGeeks",
        "blurb": "Worked code, complexity tables and interview angles.",
        "url": lambda q: f"https://www.geeksforgeeks.org/?s={quote_plus(q)}",
    },
    "khan": {
        "name": "Khan Academy",
        "blurb": "Step-by-step lessons with practice problems.",
        "url": lambda q: f"https://www.khanacademy.org/search?page_search_query={quote_plus(q)}",
    },
    "mit": {
        "name": "MIT OpenCourseWare",
        "blurb": "Full university course notes, problem sets and exams.",
        "url": lambda q: f"https://ocw.mit.edu/search/?q={quote_plus(q)}",
    },
    "nptel": {
        "name": "NPTEL",
        "blurb": "Free IIT lecture series, matched to Indian syllabi.",
        "url": lambda q: f"https://www.google.com/search?q=site%3Anptel.ac.in+{quote_plus(q)}",
    },
    "mathworld": {
        "name": "Wolfram MathWorld",
        "blurb": "Rigorous mathematical treatment and identities.",
        "url": lambda q: f"https://mathworld.wolfram.com/search/?query={quote_plus(q)}",
    },
}

# Which reference platforms suit which subject, most useful first.
_SUBJECT_PLATFORMS: dict[str, list[str]] = {
    "Electronics & Communication": ["nptel", "wikipedia", "mit"],
    "Computer Science":            ["gfg", "wikipedia", "mit"],
    "Electrical Engineering":      ["khan", "nptel", "wikipedia"],
    "Mechanical Engineering":      ["nptel", "mit", "wikipedia"],
    "Civil Engineering":           ["nptel", "wikipedia", "mit"],
    "Artificial Intelligence":     ["mit", "wikipedia", "gfg"],
    "Machine Learning":            ["khan", "mit", "wikipedia"],
    "Data Structures":             ["gfg", "khan", "wikipedia"],
    "Algorithms":                  ["gfg", "mit", "mathworld"],
    "DBMS":                        ["gfg", "wikipedia", "nptel"],
    "Operating Systems":           ["gfg", "wikipedia", "nptel"],
    "OOP":                         ["gfg", "wikipedia", "mit"],
    "Computer Networks":           ["gfg", "wikipedia", "nptel"],
}

_DEFAULT_PLATFORMS = ["wikipedia", "khan", "nptel"]

# Words that add nothing to a search query.
_STOPWORDS = {
    # Question framing
    "what", "why", "how", "when", "where", "which", "who", "is", "are", "was",
    "were", "the", "a", "an", "of", "in", "on", "for", "to", "and", "or", "do",
    "does", "did", "can", "could", "should", "would",
    # Requests aimed at the tutor
    "explain", "tell", "me", "about", "please", "with", "using", "give", "show",
    "walk", "through", "understand", "help", "define", "definition", "describe",
    "list", "summarise", "summarize", "summary", "compare",
    # Framing that survives as noise in a search query
    "difference", "between", "work", "works", "mean", "means", "example",
    "short", "shortly", "sentence", "sentences", "line", "lines", "words",
    "brief", "briefly", "simple", "simply", "quickly", "basically", "actually",
    "really", "just", "one", "two", "three", "few", "some", "any", "all",
    "kind", "sort", "thing", "stuff",
}


# Kept inside words so "Kirchhoff's" does not become "Kirchhoff s".
_KEEP = "+-#'’."


def topic_from_question(question: str, max_words: int = 7) -> str:
    """Reduce a question to the phrase worth searching for."""
    cleaned = "".join(c if (c.isalnum() or c.isspace() or c in _KEEP) else " " for c in question)
    words = [w.strip(".'’-") or w for w in cleaned.split() if w.strip(_KEEP)]
    kept = [w for w in words if w.lower() not in _STOPWORDS]
    # If stripping stopwords emptied it, the original words were the topic.
    chosen = (kept or words)[:max_words]
    return " ".join(chosen).strip()


def build_resources(
    topic: str,
    subject: Optional[str] = None,
    limit: int = 6,
) -> list[dict]:
    """
    Video, playlist and reference links for a topic.

    `topic` should already be a search phrase; use topic_from_question first
    if you are starting from a student's raw question.
    """
    topic = (topic or "").strip()
    if not topic:
        return []

    # Adding the subject sharpens searches for ambiguous terms like "tree".
    scoped = f"{topic} {subject}" if subject and subject.lower() not in topic.lower() else topic

    resources: list[dict] = [
        {
            "kind": "video",
            "platform": "YouTube",
            "title": f"Video lessons on {topic}",
            "blurb": "Watch someone work through it on a whiteboard.",
            "url": _yt(f"{scoped} explained"),
        },
        {
            "kind": "playlist",
            "platform": "YouTube",
            "title": f"Full course playlists on {topic}",
            "blurb": "Structured series that build up from the basics.",
            "url": _yt_playlists(f"{scoped} full course"),
        },
    ]

    keys = _SUBJECT_PLATFORMS.get(subject or "", _DEFAULT_PLATFORMS)
    for key in keys:
        platform = _PLATFORMS[key]
        resources.append({
            "kind": "reference",
            "platform": platform["name"],
            "title": f"{topic} on {platform['name']}",
            "blurb": platform["blurb"],
            "url": platform["url"](scoped),
        })

    return resources[:limit]
