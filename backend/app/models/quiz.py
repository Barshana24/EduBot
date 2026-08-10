from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    subject = Column(String(100), nullable=False)
    language = Column(String(50), default="English")
    difficulty = Column(String(50), default="Intermediate")
    total_questions = Column(Integer, default=0)
    score = Column(Float, nullable=True)
    completed = Column(Boolean, default=False)
    time_taken_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_answer = Column(String(10), nullable=False)
    explanation = Column(Text, nullable=True)
    user_answer = Column(String(10), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    order_num = Column(Integer, default=0)

    quiz = relationship("Quiz", back_populates="questions")


class FlashCard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    language = Column(String(50), default="English")
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)
    times_reviewed = Column(Integer, default=0)
    confidence_level = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_reviewed = Column(DateTime(timezone=True), nullable=True)


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(100), nullable=False)
    topics_covered = Column(JSON, default=list)
    sessions_count = Column(Integer, default=0)
    quiz_avg_score = Column(Float, default=0.0)
    total_study_minutes = Column(Integer, default=0)
    last_studied = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="progress")
