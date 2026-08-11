from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    preferred_language = Column(String(50), default="English")
    preferred_subject = Column(String(100), nullable=True)
    explanation_level = Column(String(50), default="Intermediate")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    total_sessions = Column(Integer, default=0)
    total_messages = Column(Integer, default=0)
    quizzes_completed = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    # Distinct days this account has shown up. Only ever grows, so the XP it
    # earns can never be taken away by a broken streak.
    login_days = Column(Integer, default=0, server_default="0")
    last_login_date = Column(Date, nullable=True)
    longest_streak = Column(Integer, default=0, server_default="0")
    last_active = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
