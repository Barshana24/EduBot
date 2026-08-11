from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.core.security import get_current_user_id
from app.services.resource_service import build_resources, topic_from_question

router = APIRouter()


@router.get("")
async def get_resources(
    topic: str = Query("", description="Topic or the student's raw question"),
    subject: Optional[str] = Query(None),
    limit: int = Query(6, ge=1, le=12),
    _user_id: int = Depends(get_current_user_id),
):
    """
    Videos, playlists and reference sites for a topic.

    Cheap and deterministic: no model call, so this costs nothing against the
    Gemini quota and never returns a made-up link.
    """
    cleaned = topic_from_question(topic)
    return {
        "topic": cleaned,
        "subject": subject,
        "resources": build_resources(cleaned, subject, limit),
    }
