from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json
import logging

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.chat import ChatSession, Message
from app.models.user import User
from app.services.gemini_service import stream_chat, check_gemini_health
from app.services import document_service
from app.utils.language_detection import detect_language

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    subject: Optional[str] = None
    language: Optional[str] = None
    level: Optional[str] = "Intermediate"
    mode: Optional[str] = "chat"
    use_documents: Optional[bool] = False


class SessionCreateRequest(BaseModel):
    title: Optional[str] = "New Chat"
    subject: Optional[str] = None
    language: Optional[str] = "English"


def _session_response(session: ChatSession) -> dict:
    return {
        "id": session.id,
        "title": session.title,
        "subject": session.subject,
        "language": session.language,
        "mode": session.mode,
        "message_count": session.message_count,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }


def _message_response(message: Message) -> dict:
    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "language": message.language,
        "subject": message.subject,
        "mode": message.mode,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


@router.get("/health")
async def llm_health():
    return await check_gemini_health()


@router.post("/sessions")
async def create_session(
    payload: SessionCreateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    session = ChatSession(
        user_id=user_id,
        title=payload.title,
        subject=payload.subject,
        language=payload.language,
    )
    db.add(session)

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.total_sessions = (user.total_sessions or 0) + 1

    db.commit()
    db.refresh(session)
    return _session_response(session)


@router.get("/sessions")
async def list_sessions(
    search: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = db.query(ChatSession).filter(
        ChatSession.user_id == user_id,
        ChatSession.is_archived == False,
    )

    if search:
        query = query.filter(ChatSession.title.ilike(f"%{search}%"))
    if subject:
        query = query.filter(ChatSession.subject == subject)

    sessions = query.order_by(ChatSession.updated_at.desc().nullslast(), ChatSession.created_at.desc()).offset(skip).limit(limit).all()
    return [_session_response(s) for s in sessions]


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
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
    return {
        "session": _session_response(session),
        "messages": [_message_response(m) for m in messages],
    }


@router.delete("/sessions/{session_id}")
async def delete_session(
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
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}


@router.post("/send")
async def send_message(
    payload: ChatRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    detected_language = payload.language or detect_language(payload.message) or user.preferred_language or "English"
    subject = payload.subject or user.preferred_subject
    level = payload.level or user.explanation_level or "Intermediate"

    if not payload.session_id:
        title = payload.message[:60] + "..." if len(payload.message) > 60 else payload.message
        session = ChatSession(
            user_id=user_id,
            title=title,
            subject=subject,
            language=detected_language,
            mode=payload.mode,
        )
        db.add(session)
        user.total_sessions = (user.total_sessions or 0) + 1
        db.commit()
        db.refresh(session)
    else:
        session = db.query(ChatSession).filter(
            ChatSession.id == payload.session_id,
            ChatSession.user_id == user_id,
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    history_msgs = db.query(Message).filter(Message.session_id == session.id).order_by(Message.created_at).all()
    history = [{"role": m.role, "content": m.content} for m in history_msgs[-12:]]

    context_docs = ""
    if payload.use_documents:
        context_docs = document_service.query_documents(db, user_id, payload.message, n_results=4, subject_filter=subject)

    user_message = Message(
        session_id=session.id,
        role="user",
        content=payload.message,
        language=detected_language,
        subject=subject,
        mode=payload.mode,
    )
    db.add(user_message)
    session.message_count = (session.message_count or 0) + 1
    user.total_messages = (user.total_messages or 0) + 1
    db.commit()

    full_response = []

    async def generate():
        async for chunk in stream_chat(
            message=payload.message,
            language=detected_language,
            subject=subject,
            level=level,
            mode=payload.mode,
            history=history,
            context_docs=context_docs if context_docs else None,
        ):
            full_response.append(chunk)
            yield f"data: {json.dumps({'content': chunk, 'session_id': session.id})}\n\n"

        complete_response = "".join(full_response)
        assistant_message = Message(
            session_id=session.id,
            role="assistant",
            content=complete_response,
            language=detected_language,
            subject=subject,
            mode=payload.mode,
        )
        db.add(assistant_message)
        session.message_count = (session.message_count or 0) + 1
        db.commit()

        yield f"data: {json.dumps({'done': True, 'session_id': session.id, 'message_id': assistant_message.id})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Session-ID": str(session.id),
        },
    )


@router.put("/sessions/{session_id}/title")
async def update_session_title(
    session_id: int,
    title: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.title = title[:200]
    db.commit()
    return {"message": "Title updated"}
