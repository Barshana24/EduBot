import logging
from typing import List, Optional

from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import DocumentChunk

logger = logging.getLogger(__name__)

_client = genai.Client(api_key=settings.GEMINI_API_KEY)

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunks.append(" ".join(words[i : i + chunk_size]))
        i += chunk_size - overlap
    return chunks if chunks else [text]


def _embed(text: str, task_type: str) -> List[float]:
    resp = _client.models.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type=task_type),
    )
    return resp.embeddings[0].values


def add_document(
    db: Session,
    user_id: int,
    doc_id: str,
    filename: str,
    subject: Optional[str],
    text: str,
) -> bool:
    try:
        chunks = _chunk_text(text)
        for i, chunk in enumerate(chunks):
            embedding = _embed(chunk, task_type="RETRIEVAL_DOCUMENT")
            db.add(DocumentChunk(
                user_id=user_id,
                doc_id=doc_id,
                filename=filename,
                subject=subject,
                chunk_index=i,
                content=chunk,
                embedding=embedding,
            ))
        db.commit()
        logger.info(f"Indexed {len(chunks)} chunks for document {doc_id}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error indexing document {doc_id}: {e}")
        return False


def query_documents(
    db: Session,
    user_id: int,
    query: str,
    n_results: int = 5,
    subject_filter: Optional[str] = None,
) -> str:
    try:
        query_embedding = _embed(query, task_type="RETRIEVAL_QUERY")
        q = db.query(DocumentChunk).filter(DocumentChunk.user_id == user_id)
        if subject_filter:
            q = q.filter(DocumentChunk.subject == subject_filter)
        results = (
            q.order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(n_results)
            .all()
        )

        if not results:
            return ""

        context_parts = [f"[From: {r.filename}]\n{r.content}" for r in results]
        return "\n\n---\n\n".join(context_parts)
    except Exception as e:
        logger.error(f"Error querying documents: {e}")
        return ""


def delete_document(db: Session, user_id: int, doc_id: str) -> bool:
    try:
        deleted = db.query(DocumentChunk).filter(
            DocumentChunk.user_id == user_id,
            DocumentChunk.doc_id == doc_id,
        ).delete()
        db.commit()
        return deleted > 0
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting document {doc_id}: {e}")
        return False


def list_documents(db: Session, user_id: int) -> List[dict]:
    try:
        rows = (
            db.query(
                DocumentChunk.doc_id,
                DocumentChunk.filename,
                DocumentChunk.subject,
                DocumentChunk.created_at,
            )
            .filter(DocumentChunk.user_id == user_id, DocumentChunk.chunk_index == 0)
            .all()
        )
        return [
            {
                "doc_id": r.doc_id,
                "filename": r.filename,
                "subject": r.subject,
                "uploaded_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        return []
