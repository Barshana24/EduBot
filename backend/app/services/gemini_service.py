import logging
from typing import AsyncGenerator, Optional

from google import genai
from google.genai import types
from google.genai.errors import ClientError, ServerError

from app.core.config import settings
from app.utils.language_detection import get_language_instruction

logger = logging.getLogger(__name__)

_client = genai.Client(api_key=settings.GEMINI_API_KEY)

SUBJECT_CONTEXT = {
    "Electronics & Communication": "electronics, circuits, signals, communication systems, semiconductors, analog/digital electronics",
    "Computer Science": "programming, data structures, algorithms, software engineering, computer architecture",
    "Electrical Engineering": "power systems, electrical machines, control systems, circuit analysis",
    "Mechanical Engineering": "thermodynamics, fluid mechanics, strength of materials, manufacturing",
    "Civil Engineering": "structural engineering, construction, surveying, geotechnical engineering",
    "Artificial Intelligence": "machine learning, neural networks, natural language processing, computer vision",
    "Machine Learning": "supervised/unsupervised learning, deep learning, model training, feature engineering",
    "Data Structures": "arrays, linked lists, trees, graphs, hash tables, stacks, queues",
    "Algorithms": "sorting, searching, dynamic programming, graph algorithms, complexity analysis",
    "DBMS": "relational databases, SQL, normalization, transactions, indexing, query optimization",
    "Operating Systems": "process management, memory management, file systems, scheduling, synchronization",
    "OOP": "classes, objects, inheritance, polymorphism, encapsulation, design patterns",
    "Computer Networks": "OSI model, TCP/IP, routing, switching, network security, protocols",
}

LEVEL_INSTRUCTIONS = {
    "Beginner": "Use very simple language, avoid jargon, use real-world analogies, explain every term.",
    "Intermediate": "Assume basic knowledge, use proper terminology, include examples with code/formulas.",
    "Advanced": "Assume strong background, use precise technical language, include edge cases and advanced nuances.",
}

MODE_INSTRUCTIONS = {
    "chat": "Explain the concept clearly with examples, analogies, and structured markdown formatting.",
    "quiz": """Generate exactly 5 multiple choice questions. Use this exact JSON format:
{
  "questions": [
    {
      "question": "question text",
      "options": {"A": "option1", "B": "option2", "C": "option3", "D": "option4"},
      "correct": "A",
      "explanation": "why this is correct"
    }
  ]
}
Output ONLY the JSON, no other text.""",
    "interview": """Provide 5 interview questions with model answers. Format:
**Q1:** [Question]
**Answer:** [Detailed model answer]
[repeat for all 5]""",
    "flashcard": """Generate 6 flashcard pairs. Use this exact JSON format:
{
  "flashcards": [
    {"front": "term or question", "back": "definition or answer"}
  ]
}
Output ONLY the JSON, no other text.""",
    "formula": "Explain the formula with: definition, all variable meanings, derivation steps, practical examples, and units.",
    "summary": "Create a concise, well-structured study summary with bullet points, key terms highlighted, and a recap section.",
}


def build_system_prompt(
    language: str,
    subject: Optional[str],
    level: str,
    mode: str,
) -> str:
    lang_instruction = get_language_instruction(language)
    subject_ctx = SUBJECT_CONTEXT.get(subject, "general engineering") if subject else "general engineering"
    level_inst = LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["Intermediate"])
    mode_inst = MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS["chat"])

    return f"""You are EduBot 🤖✨, a friendly and expert AI engineering tutor with a warm, encouraging personality.

LANGUAGE RULE (MOST IMPORTANT): {lang_instruction}
Keep technical terms in English even when explaining in other languages.

SUBJECT EXPERTISE: You are an expert in {subject_ctx}.
EXPLANATION LEVEL: {level_inst}
CURRENT MODE: {mode_inst}

PERSONALITY TRAITS:
- Warm, encouraging, and patient
- Use emojis occasionally to make explanations fun
- Celebrate good questions with enthusiasm
- Break down complex topics step by step
- Always provide practical, real-world examples

FORMATTING RULES:
- Use markdown formatting (headers, bold, italics, code blocks)
- For code, always specify the language in code fences
- For formulas, use clear notation
- Structure long responses with sections
- Keep responses comprehensive but not overwhelming

Remember: You help students understand engineering concepts clearly in their preferred language!"""


def _to_gemini_contents(history: list, user_content: str) -> list[types.Content]:
    contents = []
    for h in history[-8:]:
        role = "model" if h["role"] == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=h["content"])]))
    contents.append(types.Content(role="user", parts=[types.Part(text=user_content)]))
    return contents


async def stream_chat(
    message: str,
    language: str,
    subject: Optional[str],
    level: str,
    mode: str,
    history: list,
    context_docs: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    system_prompt = build_system_prompt(language, subject, level, mode)

    user_content = message
    if context_docs:
        user_content = f"Context from uploaded documents:\n{context_docs}\n\nQuestion: {message}"

    contents = _to_gemini_contents(history, user_content)

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.7,
        top_p=0.9,
    )

    try:
        stream = await _client.aio.models.generate_content_stream(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=config,
        )
        async for chunk in stream:
            if chunk.text:
                yield chunk.text
    except ClientError as e:
        if e.code == 429:
            logger.warning(f"Gemini rate limit hit: {e}")
            yield "⚠️ EduBot is getting a lot of questions right now. Please wait a moment and try again."
        else:
            logger.error(f"Gemini client error: {e}")
            yield f"⚠️ Couldn't process that request: {e.message or e}"
    except ServerError as e:
        logger.error(f"Gemini server error: {e}")
        yield "⚠️ EduBot's AI service is temporarily unavailable. Please try again shortly."
    except Exception as e:
        logger.error(f"Gemini streaming error: {e}")
        yield f"⚠️ An unexpected error occurred: {str(e)}"


async def generate_response(
    message: str,
    language: str,
    subject: Optional[str],
    level: str,
    mode: str,
    history: list,
    context_docs: Optional[str] = None,
) -> str:
    full_response = ""
    async for chunk in stream_chat(message, language, subject, level, mode, history, context_docs):
        full_response += chunk
    return full_response


async def check_gemini_health() -> dict:
    try:
        pager = await _client.aio.models.list()
        async for _ in pager:
            break
        return {"status": "healthy", "model": settings.GEMINI_MODEL}
    except Exception as e:
        return {"status": "unavailable", "error": str(e)}
