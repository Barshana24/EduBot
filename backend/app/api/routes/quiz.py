from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.quiz import Quiz, QuizQuestion, FlashCard
from app.models.user import User
from app.services.gemini_service import generate_response
from app.services.pdf_service import generate_quiz_pdf
from app.core.json_repair import extract_list, is_service_error

router = APIRouter()
logger = logging.getLogger(__name__)


class GenerateQuizRequest(BaseModel):
    subject: str
    topic: Optional[str] = None
    difficulty: Optional[str] = "Intermediate"
    language: Optional[str] = "English"
    num_questions: Optional[int] = 5


class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str


class CompleteQuizRequest(BaseModel):
    answers: List[SubmitAnswerRequest]
    time_taken_seconds: Optional[int] = None


class GenerateFlashcardsRequest(BaseModel):
    subject: str
    topic: Optional[str] = None
    language: Optional[str] = "English"
    num_cards: Optional[int] = 6


@router.post("/generate")
async def generate_quiz(
    payload: GenerateQuizRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    topic_str = f" on the topic of {payload.topic}" if payload.topic else ""
    prompt = f"Generate a quiz about {payload.subject}{topic_str}."

    response = await generate_response(
        message=prompt,
        language=payload.language,
        subject=payload.subject,
        level=payload.difficulty,
        mode="quiz",
        history=[],
    )

    # The AI wrapper reports upstream failures as a readable string rather than
    # raising, so surface that instead of a generic parse failure.
    if is_service_error(response):
        logger.warning(f"Quiz generation blocked upstream: {response[:160]}")
        raise HTTPException(status_code=503, detail=response.strip())

    # Tolerant of a response cut short by the output-token limit: the questions
    # that arrived complete are kept rather than discarding the whole quiz.
    questions_data = extract_list(response, "questions")
    questions_data = [q for q in questions_data if q.get("question") and q.get("options")]

    if not questions_data:
        logger.error(f"No usable questions in quiz response: {response[:400]}")
        raise HTTPException(status_code=502, detail="Couldn't build that quiz. Please try again.")

    title = f"{payload.subject} Quiz" + (f" - {payload.topic}" if payload.topic else "")
    quiz = Quiz(
        user_id=user_id,
        title=title,
        subject=payload.subject,
        language=payload.language,
        difficulty=payload.difficulty,
        total_questions=len(questions_data),
    )
    db.add(quiz)
    db.flush()

    for i, q in enumerate(questions_data):
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q.get("question", ""),
            options=q.get("options", {}),
            correct_answer=q.get("correct", "A"),
            explanation=q.get("explanation", ""),
            order_num=i,
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)

    return {
        "quiz_id": quiz.id,
        "title": quiz.title,
        "subject": quiz.subject,
        "difficulty": quiz.difficulty,
        "language": quiz.language,
        "total_questions": quiz.total_questions,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": q.options,
                "order_num": q.order_num,
            }
            for q in quiz.questions
        ],
    }


@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: int,
    payload: CompleteQuizRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.completed:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    answer_map = {a.question_id: a.answer for a in payload.answers}
    correct_count = 0

    for question in quiz.questions:
        user_answer = answer_map.get(question.id)
        if user_answer:
            question.user_answer = user_answer
            question.is_correct = user_answer.upper() == question.correct_answer.upper()
            if question.is_correct:
                correct_count += 1

    score = (correct_count / len(quiz.questions)) * 100 if quiz.questions else 0
    quiz.score = score
    quiz.completed = True
    quiz.completed_at = datetime.utcnow()
    quiz.time_taken_seconds = payload.time_taken_seconds

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.quizzes_completed = (user.quizzes_completed or 0) + 1

    db.commit()
    db.refresh(quiz)

    return {
        "quiz_id": quiz.id,
        "score": score,
        "correct_count": correct_count,
        "total_questions": len(quiz.questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "user_answer": q.user_answer,
                "is_correct": q.is_correct,
                "explanation": q.explanation,
            }
            for q in quiz.questions
        ],
    }


@router.get("/history")
async def quiz_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    quizzes = db.query(Quiz).filter(Quiz.user_id == user_id).order_by(Quiz.created_at.desc()).limit(20).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "subject": q.subject,
            "difficulty": q.difficulty,
            "score": q.score,
            "completed": q.completed,
            "total_questions": q.total_questions,
            "created_at": q.created_at.isoformat() if q.created_at else None,
        }
        for q in quizzes
    ]


@router.get("/{quiz_id}/pdf")
async def download_quiz_pdf(
    quiz_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    user = db.query(User).filter(User.id == user_id).first()
    quiz_data = {
        "subject": quiz.subject,
        "difficulty": quiz.difficulty,
        "score": quiz.score,
        "questions": [
            {
                "question_text": q.question_text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "user_answer": q.user_answer,
                "explanation": q.explanation,
            }
            for q in quiz.questions
        ],
    }

    pdf_bytes = generate_quiz_pdf(quiz_data, user.username if user else "Student")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=quiz_{quiz_id}.pdf"},
    )


@router.post("/flashcards/generate")
async def generate_flashcards(
    payload: GenerateFlashcardsRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    topic_str = f" on {payload.topic}" if payload.topic else ""
    prompt = f"Generate flashcards about {payload.subject}{topic_str}."

    response = await generate_response(
        message=prompt,
        language=payload.language,
        subject=payload.subject,
        level="Intermediate",
        mode="flashcard",
        history=[],
    )

    if is_service_error(response):
        logger.warning(f"Flashcard generation blocked upstream: {response[:160]}")
        raise HTTPException(status_code=503, detail=response.strip())

    cards = extract_list(response, "flashcards")
    cards = [c for c in cards if c.get("front") and c.get("back")]

    if not cards:
        logger.error(f"No usable flashcards in response: {response[:400]}")
        raise HTTPException(status_code=502, detail="Couldn't build that deck. Please try again.")

    saved_cards = []
    for card in cards:
        fc = FlashCard(
            user_id=user_id,
            subject=payload.subject,
            language=payload.language,
            front=card.get("front", ""),
            back=card.get("back", ""),
        )
        db.add(fc)
        saved_cards.append(fc)

    db.commit()
    return {
        "count": len(saved_cards),
        "flashcards": [
            {"id": fc.id, "front": fc.front, "back": fc.back, "subject": fc.subject}
            for fc in saved_cards
        ],
    }


@router.get("/flashcards")
async def list_flashcards(
    subject: Optional[str] = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    query = db.query(FlashCard).filter(FlashCard.user_id == user_id)
    if subject:
        query = query.filter(FlashCard.subject == subject)
    cards = query.order_by(FlashCard.created_at.desc()).limit(50).all()
    return [
        {
            "id": c.id,
            "front": c.front,
            "back": c.back,
            "subject": c.subject,
            "confidence_level": c.confidence_level,
            "times_reviewed": c.times_reviewed,
        }
        for c in cards
    ]


@router.put("/flashcards/{card_id}/review")
async def review_flashcard(
    card_id: int,
    confidence: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    card = db.query(FlashCard).filter(FlashCard.id == card_id, FlashCard.user_id == user_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    card.times_reviewed = (card.times_reviewed or 0) + 1
    card.confidence_level = max(0, min(5, confidence))
    card.last_reviewed = datetime.utcnow()
    db.commit()
    return {"message": "Review recorded"}
