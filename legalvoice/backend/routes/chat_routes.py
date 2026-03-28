from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import google.generativeai as genai
from bson import ObjectId
from models import User
from main import db, get_active_user_with_db
import io

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
    responses={404: {"description": "Not found"}},
)

# Supported regional languages (8 languages as per project spec)
LANGUAGE_CODES = {
    "English": "en",
    "Hindi": "hi",
    "Tamil": "ta",
    "Bengali": "bn",
    "Marathi": "mr",
    "Telugu": "te",
    "Kannada": "kn",
    "Gujarati": "gu",
}

LANGUAGE_INSTRUCTIONS = {
    "Hindi":    "Respond in Hindi (हिन्दी) using Devanagari script.",
    "Tamil":    "Respond in Tamil (தமிழ்).",
    "Bengali":  "Respond in Bengali (বাংলা).",
    "Marathi":  "Respond in Marathi (मराठी).",
    "Telugu":   "Respond in Telugu (తెలుగు).",
    "Kannada":  "Respond in Kannada (ಕನ್ನಡ).",
    "Gujarati": "Respond in Gujarati (ગુજરાતી).",
    "English":  "Respond in English.",
}


class ChatMessage(BaseModel):
    content: str
    sender: str           # 'user' or 'bot'
    language: str = "English"


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    language: str = "English"
    session_id: Optional[str] = None


def _get_legal_system_prompt(language: str = "English") -> str:
    """Build a multilingual legal assistant system prompt."""
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["English"])
    return (
        f"You are LegalVoice AI, an expert legal assistant specializing in Indian law. "
        f"You help users with legal queries, document understanding, and legal document creation. "
        f"Always provide accurate, helpful, and professional advice. "
        f"{lang_instruction} "
        f"If you are unsure, recommend consulting a licensed attorney."
    )


def _get_document_type_prompt(messages: List[ChatMessage], language: str) -> str:
    conversation = "\n".join(msg.content for msg in messages if msg.sender == "user")
    return f"""As a legal assistant, analyze the following conversation and determine what legal document the user needs.

User conversation:
{conversation}

Based on the information provided, identify which of the following document types would be most appropriate:
1. Traffic Challan
2. General Affidavit
3. Power of Attorney
4. Rent Agreement
5. Income Declaration
6. Will
7. Vehicle Registration
8. Property Sale Agreement
9. Tax Exemption
10. Employment Contract

If none of these match or there's insufficient information, indicate "Insufficient Information".

Return ONLY the document type name (e.g. "Rent Agreement") — no explanations."""


def _get_document_explanation(doc_type: str, language: str) -> str:
    base_explanations = {
        "Traffic Challan": "This document helps you pay traffic violation fines. Provide violation details, vehicle info, and payment method.",
        "General Affidavit": "A sworn statement for various legal purposes. Provide personal details and the specific declaration.",
        "Power of Attorney": "Authorizes someone to act on your behalf. Provide details of both parties and the specific powers granted.",
        "Rent Agreement": "A landlord-tenant contract establishing rental terms. Provide property details, parties, rent amount, and duration.",
        "Income Declaration": "Formally states your income for official purposes. Provide personal and accurate income information.",
        "Will": "Expresses how your assets should be distributed after death. Provide personal details, beneficiaries, and asset details.",
        "Vehicle Registration": "Registers your vehicle with transportation authorities. Provide vehicle details and ownership proof.",
        "Property Sale Agreement": "A real estate sale contract. Provide property details, buyer/seller info, and sale terms.",
        "Tax Exemption": "Requests exemption from certain taxes. Provide personal details and basis for exemption.",
        "Employment Contract": "A formal employer-employee agreement. Provide parties' details, responsibilities, compensation, and duration.",
    }

    hindi_explanations = {
        "Traffic Challan": "यह दस्तावेज़ यातायात उल्लंघन जुर्माना भुगतान में मदद करता है।",
        "General Affidavit": "हलफनामा विभिन्न कानूनी उद्देश्यों के लिए एक शपथ बयान है।",
        "Power of Attorney": "यह दस्तावेज़ किसी को आपकी ओर से कार्य करने के लिए अधिकृत करता है।",
        "Rent Agreement": "मकान मालिक और किरायेदार के बीच किराये की शर्तें स्थापित करने वाला अनुबंध।",
        "Income Declaration": "आधिकारिक उद्देश्यों के लिए आपकी आय को औपचारिक रूप से बताने वाला दस्तावेज़।",
        "Will": "मृत्यु के बाद संपत्ति वितरण की इच्छा व्यक्त करने वाला कानूनी दस्तावेज़।",
    }

    if language == "Hindi":
        return hindi_explanations.get(doc_type, base_explanations.get(doc_type, ""))
    return base_explanations.get(doc_type, "")


@router.post("/message", response_model=Dict)
async def send_message(
    chat_data: ChatRequest = Body(...),
    current_user: Optional[User] = Depends(get_active_user_with_db),
):
    try:
        last_message = next(
            (msg.content for msg in reversed(chat_data.messages) if msg.sender == "user"),
            None,
        )
        if not last_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No user message found in the request",
            )

        system_prompt = _get_legal_system_prompt(chat_data.language)

        # Build conversation history for context
        history_text = ""
        for msg in chat_data.messages[:-1]:  # All but the last message
            role = "User" if msg.sender == "user" else "Assistant"
            history_text += f"{role}: {msg.content}\n"

        full_prompt = f"{system_prompt}\n\n{history_text}User: {last_message}\nAssistant:"

        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            full_prompt,
            generation_config={"temperature": 0.7, "max_output_tokens": 1024},
        )

        # Persist chat record
        if current_user:
            chat_record = {
                "user_id": ObjectId(current_user.id),
                "session_id": chat_data.session_id or str(ObjectId()),
                "messages": [
                    {
                        "content": msg.content,
                        "sender": msg.sender,
                        "timestamp": datetime.utcnow(),
                    }
                    for msg in chat_data.messages
                ] + [{
                    "content": response.text,
                    "sender": "bot",
                    "timestamp": datetime.utcnow(),
                }],
                "language": chat_data.language,
                "updated_at": datetime.utcnow(),
            }
            await db.chat_interactions.insert_one(chat_record)

        return {
            "success": True,
            "reply": response.text,
            "session_id": chat_data.session_id or str(ObjectId()),
            "language": chat_data.language,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat message: {str(e)}",
        )


@router.post("/analyze-document", response_model=Dict)
async def analyze_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_active_user_with_db),
):
    try:
        file_content = await file.read()
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(file_content)

        try:
            # Use gemini-1.5-pro for multimodal (vision) analysis
            model = genai.GenerativeModel("gemini-1.5-pro")
            with open(temp_path, "rb") as img_file:
                response = model.generate_content([
                    "Analyze this legal document and provide: 1) Document type, 2) Parties involved, "
                    "3) Key obligations, 4) Important dates, 5) Summary in plain language.",
                    {"mime_type": file.content_type, "data": img_file.read()},
                ])

            analysis_record = {
                "user_id": ObjectId(current_user.id),
                "file_name": file.filename,
                "file_type": file.content_type,
                "analysis": response.text,
                "timestamp": datetime.utcnow(),
            }
            await db.document_analyses.insert_one(analysis_record)

            return {
                "success": True,
                "analysis": response.text,
                "file_name": file.filename,
            }
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing document: {str(e)}",
        )


@router.post("/suggest-document", response_model=Dict)
async def suggest_document(
    chat_data: ChatRequest = Body(...),
    current_user: Optional[User] = None,
):
    try:
        prompt = _get_document_type_prompt(chat_data.messages, chat_data.language)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        suggested_doc = response.text.strip()

        if "Insufficient Information" in suggested_doc:
            return {
                "document_type": None,
                "confidence": 0,
                "explanation": "I need more information to suggest a specific document type. Could you describe your situation in more detail?",
                "language": chat_data.language,
            }

        explanation = _get_document_explanation(suggested_doc, chat_data.language)

        if current_user:
            chat_record = {
                "user_id": ObjectId(current_user.id),
                "conversation": "\n".join(
                    f"{msg.sender}: {msg.content}" for msg in chat_data.messages
                ),
                "suggested_document": suggested_doc,
                "language": chat_data.language,
                "timestamp": datetime.utcnow(),
            }
            await db.chat_interactions.insert_one(chat_record)

        return {
            "document_type": suggested_doc,
            "confidence": 0.85,
            "explanation": explanation,
            "language": chat_data.language,
            "next_step": f"/documents/create?type={suggested_doc.lower().replace(' ', '-')}",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error suggesting document: {str(e)}",
        )


@router.post("/translate", response_model=Dict)
async def translate_text(text_data: Dict = Body(...)):
    try:
        text = text_data.get("text", "")
        target_language = text_data.get("target_language", "Hindi")

        if not text:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No text provided")

        if target_language not in LANGUAGE_CODES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported language. Supported: {list(LANGUAGE_CODES.keys())}",
            )

        prompt = (
            f"Translate the following text to {target_language}. "
            f"Preserve any legal terminology accurately. "
            f"Return ONLY the translated text.\n\nText:\n{text}"
        )

        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)

        return {
            "original_text": text,
            "translated_text": response.text.strip(),
            "language": target_language,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error translating text: {str(e)}",
        )