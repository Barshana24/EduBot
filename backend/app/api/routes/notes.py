from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.chat import ChatSession, Message
from app.models.user import User
from app.services.gemini_service import generate_response
from app.services.pdf_service import generate_chat_notes_pdf

router = APIRouter()


class GenerateSummaryRequest(BaseModel):
    session_id: int
    language: Optional[str] = "English"


class GenerateStudyNotesRequest(BaseModel):
    topic: str
    subject: str
    language: Optional[str] = "English"
    level: Optional[str] = "Intermediate"


@router.post("/summary")
async def generate_summary(
    payload: GenerateSummaryRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == payload.session_id,
        ChatSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(Message).filter(Message.session_id == session.id).all()
    if not messages:
        raise HTTPException(status_code=400, detail="No messages to summarize")

    conversation = "\n".join([f"{m.role.upper()}: {m.content}" for m in messages])
    prompt = f"Create a concise study summary of this conversation:\n\n{conversation}"

    summary = await generate_response(
        message=prompt,
        language=payload.language,
        subject=session.subject,
        level="Intermediate",
        mode="summary",
        history=[],
    )

    return {"summary": summary, "session_title": session.title}


@router.post("/generate")
async def generate_study_notes(
    payload: GenerateStudyNotesRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    prompt = f"Create comprehensive study notes for: {payload.topic} in {payload.subject}"

    notes = await generate_response(
        message=prompt,
        language=payload.language,
        subject=payload.subject,
        level=payload.level,
        mode="summary",
        history=[],
    )

    return {
        "topic": payload.topic,
        "subject": payload.subject,
        "language": payload.language,
        "notes": notes,
    }


@router.get("/session/{session_id}/pdf")
async def download_session_pdf(
    session_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at).all()
    if not messages:
        raise HTTPException(status_code=400, detail="No messages in this session")

    user = db.query(User).filter(User.id == user_id).first()
    msgs_data = [{"role": m.role, "content": m.content} for m in messages]

    pdf_bytes = generate_chat_notes_pdf(
        messages=msgs_data,
        session_title=session.title,
        subject=session.subject,
        language=session.language,
        username=user.username if user else "Student",
    )

    filename = f"edubot_notes_{session_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
