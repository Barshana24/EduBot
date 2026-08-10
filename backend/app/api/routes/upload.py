import os
import uuid
import logging
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.config import settings
from app.services import document_service

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


async def extract_text_from_file(file_path: str, content_type: str) -> str:
    if content_type == "text/plain":
        async with aiofiles.open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return await f.read()

    if content_type == "application/pdf":
        try:
            import PyPDF2
            text_parts = []
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
            return "\n\n".join(text_parts)
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return ""

    return ""


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    subject: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if file.size and file.size > settings.max_file_bytes:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum is {settings.MAX_FILE_SIZE_MB}MB")

    ext = os.path.splitext(file.filename or "")[-1].lower().lstrip(".")
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=415,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(settings.allowed_extensions)}",
        )

    content = await file.read()
    if len(content) > settings.max_file_bytes:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum is {settings.MAX_FILE_SIZE_MB}MB")

    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}.{ext}"
    user_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, safe_filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    text = await extract_text_from_file(file_path, file.content_type or "text/plain")

    if text.strip():
        document_service.add_document(
            db=db,
            user_id=user_id,
            doc_id=doc_id,
            filename=file.filename,
            subject=subject,
            text=text,
        )

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "subject": subject,
        "size_bytes": len(content),
        "text_extracted": len(text) > 0,
        "chunks_indexed": len(text.split()) // 400 + 1 if text else 0,
        "message": "Document uploaded and indexed successfully" if text else "Document uploaded (no text extracted)",
    }


@router.get("/documents")
async def list_documents(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    docs = document_service.list_documents(db, user_id)
    return {"documents": docs, "count": len(docs)}


@router.delete("/document/{doc_id}")
async def delete_document(
    doc_id: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    success = document_service.delete_document(db, user_id, doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")

    user_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    for ext in settings.allowed_extensions:
        file_path = os.path.join(user_dir, f"{doc_id}.{ext}")
        if os.path.exists(file_path):
            os.remove(file_path)
            break

    return {"message": "Document deleted successfully"}
