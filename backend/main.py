import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, chat, quiz, notes, upload, progress, resources

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# create_all only creates missing tables, never new columns on existing ones.
# There is no migration tool in this project, so columns added after the first
# deploy are applied here. Each statement is idempotent and safe to re-run.
_COLUMN_MIGRATIONS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS login_days INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting EduBot API...")
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        for statement in _COLUMN_MIGRATIONS:
            try:
                conn.execute(text(statement))
            except Exception as e:
                # A failed add on one column must not stop the app booting.
                logger.warning("Migration skipped (%s): %s", statement, e)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("EduBot API started successfully")
    yield
    logger.info("Shutting down EduBot API...")


limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])

app = FastAPI(
    title="EduBot API",
    description="AI-powered Multi-Language Engineering Tutor",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(resources.router, prefix="/api/resources", tags=["Resources"])


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EduBot API",
        "version": "1.0.0",
        "gemini_model": settings.GEMINI_MODEL,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
