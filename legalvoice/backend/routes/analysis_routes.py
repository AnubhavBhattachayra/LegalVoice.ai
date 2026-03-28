from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import os
import uuid
import io
import tempfile
from bson import ObjectId

# Optional OCR imports
try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("pytesseract/PIL not available — OCR disabled in analysis routes.")

from models import DocumentAnalysis, AnalysisQuestion
from main import get_active_user_with_db, db, genai
from models import User
from routes.credits_routes import (
    get_user_credits, log_credit_transaction,
    check_credits_available, check_feature_access
)

router = APIRouter(prefix="/analysis", tags=["document analysis"])


def _get_vision_model():
    """Return the correct multimodal Gemini model."""
    return genai.GenerativeModel("gemini-1.5-pro")


def _get_text_model():
    """Return the text-only Gemini model."""
    return genai.GenerativeModel("gemini-2.0-flash")


def _build_cot_analysis_prompt(extracted_text: str) -> str:
    """Build a Chain-of-Thought legal analysis prompt."""
    return f"""You are an expert legal analyst. Use step-by-step Chain-of-Thought reasoning to analyze this document.

Document text:
{extracted_text[:10000]}

Follow these steps:
Step 1 — Identify document type and jurisdiction.
Step 2 — Identify all parties involved and their roles.
Step 3 — Extract key obligations and rights for each party.
Step 4 — Identify critical dates, deadlines, and conditions.
Step 5 — Note any penalty, termination, or dispute resolution clauses.
Step 6 — Summarize the document in plain language (max 300 words).
Step 7 — List 5-7 key points in bullet format.

Format your response as:
**Summary:**
[comprehensive summary]

**Key Points:**
• [point 1]
• [point 2]
...

**Entities:**
- Parties: [names]
- Dates: [important dates]
- Monetary Values: [amounts]
"""


@router.post("/upload", response_model=DocumentAnalysis)
async def upload_and_analyze_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_active_user_with_db),
):
    try:
        file_extension = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        upload_dir = "uploaded_documents"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)

        file_content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)

        extracted_text = ""

        if file_extension in [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]:
            # Try OCR first, then fall back to Gemini vision
            if OCR_AVAILABLE:
                try:
                    image = Image.open(file_path)
                    extracted_text = pytesseract.image_to_string(image)
                except Exception as ocr_err:
                    print(f"OCR failed ({ocr_err}), falling back to Gemini vision.")

            if not extracted_text.strip():
                model = _get_vision_model()
                with open(file_path, "rb") as img_file:
                    response = model.generate_content([
                        "Extract ALL text from this legal document image. Preserve formatting.",
                        {"mime_type": file.content_type, "data": img_file.read()},
                    ])
                    extracted_text = response.text

        elif file_extension == ".pdf":
            # Use Gemini 1.5 Pro for PDF vision
            model = _get_vision_model()
            with open(file_path, "rb") as pdf_file:
                response = model.generate_content([
                    "Extract ALL text from this legal document PDF. Preserve structure and formatting.",
                    {"mime_type": "application/pdf", "data": pdf_file.read()},
                ])
                extracted_text = response.text
        else:
            # Plain text file
            with open(file_path, "r", encoding="utf-8", errors="ignore") as text_file:
                extracted_text = text_file.read()

        if not extracted_text or len(extracted_text.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to extract text from the document. Please ensure it is readable.",
            )

        # Chain-of-Thought analysis
        model = _get_text_model()
        prompt = _build_cot_analysis_prompt(extracted_text)
        response = model.generate_content(prompt)
        analysis_text = response.text

        # Parse summary and key points from structured response
        summary = analysis_text
        key_points: List[str] = []
        entities: Dict[str, Any] = {}

        if "**Key Points:**" in analysis_text:
            parts = analysis_text.split("**Key Points:**")
            summary_part = parts[0].replace("**Summary:**", "").strip()
            rest = parts[1]

            # Extract bullet points
            for line in rest.split("\n"):
                line = line.strip().lstrip("•-*").strip()
                if line and not line.startswith("**"):
                    key_points.append(line)
                elif line.startswith("**Entities"):
                    break

            summary = summary_part

        if "**Entities:**" in analysis_text:
            entities_part = analysis_text.split("**Entities:**")[1].strip()
            for line in entities_part.split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    entities[k.strip().lstrip("-").strip()] = v.strip()

        # Save to DB
        analysis = {
            "user_id": ObjectId(current_user.id),
            "filename": file.filename,
            "original_file_path": file_path,
            "summary": summary,
            "key_points": key_points,
            "detected_entities": entities,
            "created_at": datetime.utcnow(),
        }

        result = await db.document_analyses.insert_one(analysis)
        analysis["_id"] = result.inserted_id
        return analysis

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing document: {str(e)}",
        )


@router.get("/my-analyses", response_model=List[DocumentAnalysis])
async def get_my_analyses(current_user: User = Depends(get_active_user_with_db)):
    try:
        analyses = await db.document_analyses.find(
            {"user_id": ObjectId(current_user.id)}
        ).to_list(None)
        return analyses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving analyses: {str(e)}",
        )


@router.get("/{analysis_id}", response_model=DocumentAnalysis)
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_active_user_with_db),
):
    try:
        analysis = await db.document_analyses.find_one({
            "_id": ObjectId(analysis_id),
            "user_id": ObjectId(current_user.id),
        })
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis {analysis_id} not found or not authorized",
            )
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{analysis_id}/ask", response_model=AnalysisQuestion)
async def ask_question(
    analysis_id: str,
    question_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db),
):
    try:
        analysis = await db.document_analyses.find_one({
            "_id": ObjectId(analysis_id),
            "user_id": ObjectId(current_user.id),
        })
        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

        question = question_data.get("question", "")
        if not question:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is required")

        # Re-read file if it still exists
        file_path = analysis.get("original_file_path", "")
        extracted_text = ""
        if file_path and os.path.exists(file_path):
            file_extension = os.path.splitext(file_path)[1].lower()
            if file_extension in [".jpg", ".jpeg", ".png", ".bmp"] and OCR_AVAILABLE:
                try:
                    extracted_text = pytesseract.image_to_string(Image.open(file_path))
                except Exception:
                    pass
            elif file_extension not in [".jpg", ".jpeg", ".png", ".bmp", ".pdf"]:
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        extracted_text = f.read()
                except Exception:
                    pass

        if not extracted_text:
            extracted_text = analysis.get("summary", "")

        # Chain-of-Thought QA prompt
        model = _get_text_model()
        prompt = f"""You are an expert legal assistant. Use Chain-of-Thought reasoning to answer this question.

Document Summary:
{analysis.get('summary', '')}

Key Points:
{chr(10).join(f'• {p}' for p in analysis.get('key_points', []))}

Additional Context:
{extracted_text[:5000]}

Question: {question}

Think step by step:
1. What specific part of the document addresses this question?
2. What are the exact terms or provisions that apply?
3. What is the legal significance?
4. What is the clearest and most accurate answer?

Answer:"""

        response = model.generate_content(prompt)
        answer = response.text

        question_record = {
            "analysis_id": ObjectId(analysis_id),
            "user_id": ObjectId(current_user.id),
            "question": question,
            "answer": answer,
            "created_at": datetime.utcnow(),
        }

        result = await db.analysis_questions.insert_one(question_record)
        question_record["_id"] = result.inserted_id
        return question_record

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing question: {str(e)}",
        )


@router.get("/{analysis_id}/questions", response_model=List[AnalysisQuestion])
async def get_analysis_questions(
    analysis_id: str,
    current_user: User = Depends(get_active_user_with_db),
):
    try:
        analysis = await db.document_analyses.find_one({
            "_id": ObjectId(analysis_id),
            "user_id": ObjectId(current_user.id),
        })
        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

        questions = await db.analysis_questions.find(
            {"analysis_id": ObjectId(analysis_id)}
        ).to_list(None)
        return questions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{analysis_id}", response_model=Dict)
async def delete_analysis(
    analysis_id: str,
    current_user: User = Depends(get_active_user_with_db),
):
    try:
        analysis = await db.document_analyses.find_one({
            "_id": ObjectId(analysis_id),
            "user_id": ObjectId(current_user.id),
        })
        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

        file_path = analysis.get("original_file_path")
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

        await db.document_analyses.delete_one({"_id": ObjectId(analysis_id)})
        await db.analysis_questions.delete_many({"analysis_id": ObjectId(analysis_id)})

        return {"message": f"Analysis {analysis_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting analysis: {str(e)}",
        )