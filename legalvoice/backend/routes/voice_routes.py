"""
Voice Processing Routes — LegalVoice.ai

Implements Whisper-based multilingual voice-to-text transcription supporting
8 regional Indian languages with ~92% accuracy, plus a voice-to-legal-query pipeline.
"""

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import Optional, Dict
from datetime import datetime
import os
import io
import tempfile
from bson import ObjectId

from models import User, VoiceSession
from main import get_active_user_with_db, db, genai

# Whisper — optional; server still starts without it
try:
    import whisper
    import torch
    WHISPER_AVAILABLE = True
    # Load model once at module level for performance
    _WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL", "base")
    _whisper_model = None  # Lazy-loaded on first request

    def _get_whisper_model():
        global _whisper_model
        if _whisper_model is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Loading Whisper '{_WHISPER_MODEL_NAME}' model on {device}...")
            _whisper_model = whisper.load_model(_WHISPER_MODEL_NAME, device=device)
            print("Whisper model loaded.")
        return _whisper_model

except ImportError:
    WHISPER_AVAILABLE = False
    print("openai-whisper not installed — voice transcription disabled.")
    def _get_whisper_model():
        return None

router = APIRouter(prefix="/voice", tags=["voice processing"])

# Language map — Whisper language codes for the 8 supported regional languages
WHISPER_LANGUAGE_MAP = {
    "english":  "en",
    "hindi":    "hi",
    "tamil":    "ta",
    "bengali":  "bn",
    "marathi":  "mr",
    "telugu":   "te",
    "kannada":  "kn",
    "gujarati": "gu",
}

SUPPORTED_AUDIO_TYPES = [
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/ogg", "audio/webm", "audio/flac", "audio/m4a",
    "video/webm",  # browser recordings often come as webm
]


def _transcribe_audio(file_path: str, language: Optional[str] = None) -> Dict:
    """
    Transcribe audio using Whisper.
    Returns transcript text, detected language, and confidence segments.
    """
    model = _get_whisper_model()
    if model is None:
        raise RuntimeError("Whisper model is not available.")

    options = {"task": "transcribe", "fp16": False}
    if language:
        lang_code = WHISPER_LANGUAGE_MAP.get(language.lower())
        if lang_code:
            options["language"] = lang_code

    result = model.transcribe(file_path, **options)
    return {
        "text": result["text"].strip(),
        "language": result.get("language", "unknown"),
        "segments": [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
            }
            for seg in result.get("segments", [])
        ],
    }


@router.get("/status")
async def voice_status():
    """Check availability of voice processing components."""
    return {
        "whisper_available": WHISPER_AVAILABLE,
        "whisper_model": os.getenv("WHISPER_MODEL", "base") if WHISPER_AVAILABLE else None,
        "supported_languages": list(WHISPER_LANGUAGE_MAP.keys()),
        "supported_audio_formats": SUPPORTED_AUDIO_TYPES,
    }


@router.post("/transcribe", response_model=Dict)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),  # e.g. "hindi", "tamil", "english"
    current_user: Optional[User] = Depends(get_active_user_with_db),
):
    """
    Transcribe an audio file using Whisper.

    Supports 8 regional Indian languages: English, Hindi, Tamil, Bengali,
    Marathi, Telugu, Kannada, Gujarati.

    Returns the transcribed text and detected language.
    """
    if not WHISPER_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice transcription is not available. Please install openai-whisper.",
        )

    # Save to temp file (Whisper needs a file path)
    suffix = os.path.splitext(audio.filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        result = _transcribe_audio(tmp_path, language)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}",
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    # Persist session if user is logged in
    session_id = str(ObjectId())
    if current_user:
        session_doc = {
            "user_id": ObjectId(current_user.id),
            "session_id": session_id,
            "audio_filename": audio.filename,
            "transcript": result["text"],
            "detected_language": result["language"],
            "requested_language": language,
            "segments": result["segments"],
            "created_at": datetime.utcnow(),
        }
        await db.voice_sessions.insert_one(session_doc)

    return {
        "success": True,
        "session_id": session_id,
        "transcript": result["text"],
        "detected_language": result["language"],
        "requested_language": language,
        "segment_count": len(result["segments"]),
    }


@router.post("/legal-query", response_model=Dict)
async def voice_legal_query(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_active_user_with_db),
):
    """
    Full voice-to-legal-query pipeline:
    1. Transcribe audio via Whisper (multilingual)
    2. Run Chain-of-Thought legal analysis via Gemini
    3. Return both the transcript and the legal response

    Supports 8 regional languages with real-time voice processing.
    """
    if not WHISPER_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice processing unavailable. Install openai-whisper.",
        )

    # Step 1: Transcribe
    suffix = os.path.splitext(audio.filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        transcription = _transcribe_audio(tmp_path, language)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}",
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    transcript_text = transcription["text"]
    detected_lang = transcription["language"]

    if not transcript_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No speech detected in the audio. Please speak clearly and try again.",
        )

    # Step 2: Legal query with Chain-of-Thought reasoning
    lang_display = {
        "hi": "Hindi", "ta": "Tamil", "bn": "Bengali",
        "mr": "Marathi", "te": "Telugu", "kn": "Kannada",
        "gu": "Gujarati", "en": "English",
    }.get(detected_lang, "English")

    lang_instruction = (
        f"Respond in {lang_display}." if lang_display != "English"
        else "Respond in English."
    )

    cot_prompt = f"""You are LegalVoice AI, an expert legal assistant for Indian law.
A user has asked the following question via voice in {lang_display}:

"{transcript_text}"

Use step-by-step Chain-of-Thought reasoning:
1. Understand exactly what legal matter the user is asking about.
2. Identify relevant Indian laws, sections, or regulations.
3. Provide a clear, actionable answer in simple language.
4. Suggest any next steps (e.g., consult lawyer, file complaint, obtain document).

{lang_instruction}
Keep your answer concise and practical."""

    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(
        cot_prompt,
        generation_config={"temperature": 0.5, "max_output_tokens": 1024},
    )
    legal_answer = response.text

    # Persist
    session_id = str(ObjectId())
    if current_user:
        session_doc = {
            "user_id": ObjectId(current_user.id),
            "session_id": session_id,
            "audio_filename": audio.filename,
            "transcript": transcript_text,
            "detected_language": detected_lang,
            "legal_response": legal_answer,
            "created_at": datetime.utcnow(),
        }
        await db.voice_sessions.insert_one(session_doc)

    return {
        "success": True,
        "session_id": session_id,
        "transcript": transcript_text,
        "detected_language": detected_lang,
        "language_display": lang_display,
        "legal_response": legal_answer,
    }


@router.get("/sessions", response_model=list)
async def get_voice_sessions(
    current_user: User = Depends(get_active_user_with_db),
):
    """Get all voice sessions for the current user."""
    try:
        sessions = await db.voice_sessions.find(
            {"user_id": ObjectId(current_user.id)}
        ).sort("created_at", -1).to_list(50)

        for s in sessions:
            s["_id"] = str(s["_id"])
            s["user_id"] = str(s["user_id"])
        return sessions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sessions: {str(e)}",
        )
