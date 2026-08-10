from langdetect import detect, LangDetectException
from typing import Optional

LANGUAGE_CODE_MAP = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "zh-cn": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "pt": "Portuguese",
    "ru": "Russian",
}

SUPPORTED_LANGUAGES = {
    "English": "en",
    "Hindi": "hi",
    "Bengali": "bn",
    "Tamil": "ta",
    "Telugu": "te",
    "Marathi": "mr",
    "French": "fr",
    "Spanish": "es",
}

LANGUAGE_INSTRUCTIONS = {
    "English": "Respond entirely in English.",
    "Hindi": "पूरी तरह हिंदी में जवाब दें। तकनीकी शब्द अंग्रेजी में रख सकते हैं।",
    "Bengali": "সম্পূর্ণ বাংলায় উত্তর দিন। প্রযুক্তিগত শব্দ ইংরেজিতে রাখতে পারেন।",
    "Tamil": "முழுவதும் தமிழில் பதில் அளிக்கவும். தொழில்நுட்ப சொற்கள் ஆங்கிலத்தில் வைக்கலாம்.",
    "Telugu": "పూర్తిగా తెలుగులో సమాధానం ఇవ్వండి. సాంకేతిక పదాలు ఆంగ్లంలో ఉంచవచ్చు.",
    "Marathi": "संपूर्णपणे मराठीत उत्तर द्या. तांत्रिक शब्द इंग्रजीत ठेवू शकता.",
    "French": "Répondez entièrement en français. Les termes techniques peuvent rester en anglais.",
    "Spanish": "Responde completamente en español. Los términos técnicos pueden mantenerse en inglés.",
}


def detect_language(text: str) -> str:
    try:
        code = detect(text)
        return LANGUAGE_CODE_MAP.get(code, "English")
    except LangDetectException:
        return "English"


def get_language_instruction(language: str) -> str:
    return LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["English"])


def is_supported_language(language: str) -> bool:
    return language in SUPPORTED_LANGUAGES
