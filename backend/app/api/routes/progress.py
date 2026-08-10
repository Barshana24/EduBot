from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User
from app.models.chat import ChatSession, Message
from app.models.quiz import Quiz, UserProgress

router = APIRouter()


@router.get("/overview")
async def get_progress_overview(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}

    total_sessions = db.query(func.count(ChatSession.id)).filter(ChatSession.user_id == user_id).scalar() or 0
    total_messages = db.query(func.count(Message.id)).join(ChatSession).filter(ChatSession.user_id == user_id).scalar() or 0

    completed_quizzes = db.query(Quiz).filter(Quiz.user_id == user_id, Quiz.completed == True).all()
    avg_quiz_score = 0.0
    if completed_quizzes:
        scores = [q.score for q in completed_quizzes if q.score is not None]
        avg_quiz_score = sum(scores) / len(scores) if scores else 0.0

    subject_counts = (
        db.query(ChatSession.subject, func.count(ChatSession.id).label("count"))
        .filter(ChatSession.user_id == user_id, ChatSession.subject != None)
        .group_by(ChatSession.subject)
        .all()
    )

    subject_quiz_scores = {}
    for quiz in completed_quizzes:
        if quiz.subject not in subject_quiz_scores:
            subject_quiz_scores[quiz.subject] = []
        if quiz.score is not None:
            subject_quiz_scores[quiz.subject].append(quiz.score)

    subject_stats = []
    for subject, count in subject_counts:
        scores = subject_quiz_scores.get(subject, [])
        subject_stats.append({
            "subject": subject,
            "sessions": count,
            "avg_quiz_score": sum(scores) / len(scores) if scores else None,
            "quizzes_taken": len(scores),
        })

    recent_activity = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(7)
        .all()
    )

    return {
        "total_sessions": total_sessions,
        "total_messages": total_messages,
        "quizzes_completed": len(completed_quizzes),
        "avg_quiz_score": round(avg_quiz_score, 1),
        "streak_days": user.streak_days or 0,
        "subject_stats": subject_stats,
        "recent_activity": [
            {
                "date": s.created_at.date().isoformat() if s.created_at else None,
                "subject": s.subject,
                "title": s.title,
            }
            for s in recent_activity
        ],
        "preferred_language": user.preferred_language,
        "explanation_level": user.explanation_level,
    }


@router.get("/subjects")
async def get_subject_progress(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    subjects = (
        db.query(ChatSession.subject, func.count(ChatSession.id).label("sessions"))
        .filter(ChatSession.user_id == user_id, ChatSession.subject != None)
        .group_by(ChatSession.subject)
        .all()
    )

    result = []
    for subject, sessions in subjects:
        quizzes = db.query(Quiz).filter(
            Quiz.user_id == user_id,
            Quiz.subject == subject,
            Quiz.completed == True,
        ).all()
        scores = [q.score for q in quizzes if q.score is not None]
        result.append({
            "subject": subject,
            "sessions": sessions,
            "quizzes_completed": len(quizzes),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else None,
        })

    return result
