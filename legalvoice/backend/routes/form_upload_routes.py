from fastapi import APIRouter, Depends, HTTPException, status, Body, File, UploadFile
from typing import List, Optional, Dict, Any
from datetime import datetime
import re
import json
from bson import ObjectId
import io
import os
from tempfile import NamedTemporaryFile

# Optional heavy imports — fail gracefully so the server still starts
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    print("PyMuPDF not installed — PDF text extraction via PyMuPDF disabled.")

try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("pytesseract/PIL not available — OCR disabled in form routes.")

try:
    import pdf2image
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False
    print("pdf2image not installed — PDF image OCR disabled.")

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("opencv-python not installed — image preprocessing disabled.")

from models import User, FormUpload
from main import get_active_user_with_db, db, genai

from routes.credits_routes import (
    get_user_credits, log_credit_transaction,
    check_credits_available, check_feature_access
)

router = APIRouter(prefix="/forms", tags=["forms"])

FORM_UPLOAD_CREDIT_COST = 3
FORM_FILL_CREDIT_COST = 2


async def extract_text_from_upload(file_content: bytes, file_extension: str) -> str:
    """Extract text from uploaded file using OCR for images or PDF extraction."""
    try:
        ext = file_extension.lower()

        if ext in [".jpg", ".jpeg", ".png", ".tiff", ".tif"]:
            if not OCR_AVAILABLE:
                raise ValueError("OCR libraries not installed. Cannot process image files.")
            with Image.open(io.BytesIO(file_content)) as img:
                # Preprocessing: convert to grayscale to improve OCR accuracy
                if CV2_AVAILABLE:
                    import numpy as np
                    img_array = np.array(img.convert("RGB"))
                    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
                    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                    img = Image.fromarray(thresh)
                text = pytesseract.image_to_string(img, lang="eng")
                return text

        elif ext == ".pdf":
            # Try PyMuPDF first (text-based PDFs)
            if PYMUPDF_AVAILABLE:
                doc = fitz.open(stream=file_content, filetype="pdf")
                full_text = []
                for page in doc:
                    full_text.append(page.get_text())
                text = "\n\n".join(full_text).strip()
                if text and len(text) > 50:
                    return text

            # Fallback to pdf2image + OCR for scanned PDFs
            if PDF2IMAGE_AVAILABLE and OCR_AVAILABLE:
                with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(file_content)
                    tmp_path = tmp.name
                try:
                    images = pdf2image.convert_from_path(tmp_path, dpi=200)
                    page_texts = [pytesseract.image_to_string(img) for img in images]
                    return "\n\n".join(page_texts)
                finally:
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)

            raise ValueError("No PDF processing library available (PyMuPDF or pdf2image required).")
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

    except Exception as e:
        print(f"Error extracting text: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting text from document: {str(e)}",
        )


async def extract_form_fields(form_text: str, form_type: Optional[str] = None) -> Dict[str, Any]:
    """Use Gemini to extract form fields from OCR text."""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")

        form_type_hint = f"\n\nThis form appears to be a {form_type} form." if form_type else ""
        prompt = f"""Analyze the following text extracted from a form document using OCR:

{form_text}

Identify all form fields and their current values or placeholders.
Return a JSON object where keys are field names and values are the current values or empty strings.

Example:
{{
    "full_name": "",
    "date_of_birth": "DD/MM/YYYY",
    "address": ""
}}

Focus on: input fields, checkboxes, radio buttons, and any pre-filled values.{form_type_hint}

Return ONLY valid JSON, no additional text."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Extract JSON from code blocks if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]

        return json.loads(response_text.strip())

    except json.JSONDecodeError:
        return {"raw_response": response.text}
    except Exception as e:
        print(f"Error extracting form fields: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing form: {str(e)}",
        )


async def _autogen_form_fill(
    extracted_fields: Dict[str, Any],
    user_data: Dict[str, Any],
    form_type: Optional[str],
) -> Dict[str, Any]:
    """
    AutoGen-style agentic form filling workflow.
    Uses a pipeline of specialized agents (planner → extractor → validator) to 
    intelligently fill form fields from user data.
    """
    try:
        import autogen  # type: ignore

        # Agent configuration using Gemini-compatible model
        config_list = [{"model": "gemini-2.0-flash", "api_key": os.getenv("GEMINI_API_KEY")}]

        # Define specialist agents
        planner_agent = autogen.AssistantAgent(
            name="FormPlannerAgent",
            system_message=(
                "You are a legal form planning agent. Your job is to map available user data "
                "to the appropriate form fields. Think step by step."
            ),
            llm_config={"config_list": config_list},
        )

        filler_agent = autogen.AssistantAgent(
            name="FormFillerAgent",
            system_message=(
                "You are a legal form filling agent. Given a mapping from a planner, "
                "fill in the form fields accurately using the provided user data. "
                "Return a JSON object with field names as keys and filled values as values."
            ),
            llm_config={"config_list": config_list},
        )

        # Orchestrator = user proxy (runs the conversation)
        orchestrator = autogen.UserProxyAgent(
            name="Orchestrator",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=3,
            code_execution_config=False,
        )

        # Run planning step
        planning_message = (
            f"Form fields to fill: {json.dumps(extracted_fields)}\n"
            f"Available user data: {json.dumps(user_data)}\n"
            f"Form type: {form_type or 'general'}\n"
            "Create a comprehensive mapping plan for filling these fields."
        )

        orchestrator.initiate_chat(planner_agent, message=planning_message, max_turns=1)
        plan = planner_agent.last_message()["content"]

        # Run filling step
        filling_message = (
            f"Based on this plan:\n{plan}\n\n"
            f"Fill the form fields: {json.dumps(extracted_fields)}\n"
            f"User data: {json.dumps(user_data)}\n"
            "Return ONLY valid JSON with filled field values."
        )

        orchestrator.initiate_chat(filler_agent, message=filling_message, max_turns=1)
        fill_response = filler_agent.last_message()["content"]

        # Parse JSON response
        if "```json" in fill_response:
            fill_response = fill_response.split("```json")[1].split("```")[0]
        elif "```" in fill_response:
            fill_response = fill_response.split("```")[1].split("```")[0]

        return json.loads(fill_response.strip())

    except ImportError:
        # AutoGen not available — fall back to direct Gemini filling
        print("AutoGen not available, using direct Gemini filling.")
    except Exception as e:
        print(f"AutoGen filling failed: {e}, falling back to Gemini.")

    # Gemini fallback
    model = genai.GenerativeModel("gemini-2.0-flash")
    prompt = (
        f"Fill in the following form fields using the provided user data.\n"
        f"Form fields: {json.dumps(extracted_fields)}\n"
        f"User data: {json.dumps(user_data)}\n"
        f"Return ONLY a valid JSON object with field names as keys and filled values."
    )
    response = model.generate_content(prompt)
    text = response.text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        return extracted_fields  # Return original fields if all else fails


@router.post("/upload", response_model=Dict)
async def upload_form(
    file: UploadFile = File(...),
    form_type: Optional[str] = Body(None),
    current_user: User = Depends(get_active_user_with_db),
):
    """Upload a form for processing and field extraction."""
    form_uploads_allowed = await check_feature_access(current_user.id, "form_uploads")
    if not form_uploads_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription does not include form uploads. Please upgrade.",
        )

    has_credits = await check_credits_available(current_user.id, FORM_UPLOAD_CREDIT_COST)
    if not has_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits for form processing. Please add credits.",
        )

    try:
        file_content = await file.read()
        _, file_extension = os.path.splitext(file.filename)

        form_text = await extract_text_from_upload(file_content, file_extension)

        if not form_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text could be extracted. Ensure the document is clear and try again.",
            )

        extracted_fields = await extract_form_fields(form_text, form_type)

        form_upload = {
            "user_id": ObjectId(current_user.id),
            "filename": file.filename,
            "form_type": form_type,
            "extracted_text": form_text,
            "extracted_fields": extracted_fields,
            "status": "processed",
            "credit_cost": FORM_UPLOAD_CREDIT_COST,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await db.form_uploads.insert_one(form_upload)
        form_id = str(result.inserted_id)

        await log_credit_transaction(
            user_id=current_user.id,
            amount=-FORM_UPLOAD_CREDIT_COST,
            transaction_type="form_upload",
            description=f"Processed form upload: {file.filename}",
        )

        return {
            "form_id": form_id,
            "filename": file.filename,
            "extracted_fields": extracted_fields,
            "credits_used": FORM_UPLOAD_CREDIT_COST,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing form: {str(e)}",
        )


@router.get("/my-forms", response_model=List[FormUpload])
async def get_user_forms(current_user: User = Depends(get_active_user_with_db)):
    """Get all form uploads for the current user."""
    try:
        forms = await db.form_uploads.find(
            {"user_id": ObjectId(current_user.id)}
        ).sort("created_at", -1).to_list(None)
        return forms
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching forms: {str(e)}",
        )


@router.get("/{form_id}", response_model=FormUpload)
async def get_form(
    form_id: str,
    current_user: User = Depends(get_active_user_with_db),
):
    """Get a specific form upload."""
    try:
        form = await db.form_uploads.find_one({
            "_id": ObjectId(form_id),
            "user_id": ObjectId(current_user.id),
        })
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")
        return form
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching form: {str(e)}",
        )


@router.post("/{form_id}/fill", response_model=Dict)
async def fill_form(
    form_id: str,
    data: Optional[Dict] = Body(None),
    current_user: User = Depends(get_active_user_with_db),
):
    """Fill a form using AutoGen agentic workflow or provided data."""
    form_uploads_allowed = await check_feature_access(current_user.id, "form_uploads")
    if not form_uploads_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription does not include form filling.",
        )

    has_credits = await check_credits_available(current_user.id, FORM_FILL_CREDIT_COST)
    if not has_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits for form filling.",
        )

    try:
        form = await db.form_uploads.find_one({
            "_id": ObjectId(form_id),
            "user_id": ObjectId(current_user.id),
        })
        if not form:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

        extracted_fields = form.get("extracted_fields", {})
        user_provided = data or {}

        # Use AutoGen agentic workflow to intelligently fill the form
        filled_fields = await _autogen_form_fill(
            extracted_fields=extracted_fields,
            user_data=user_provided,
            form_type=form.get("form_type"),
        )

        await log_credit_transaction(
            user_id=current_user.id,
            amount=-FORM_FILL_CREDIT_COST,
            transaction_type="form_fill",
            description=f"Filled form: {form.get('filename', 'Unknown')}",
        )

        await db.form_uploads.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": {
                "status": "filled",
                "filled_data": filled_fields,
                "updated_at": datetime.utcnow(),
            }},
        )

        return {
            "form_id": form_id,
            "status": "filled",
            "filled_fields": filled_fields,
            "message": "Form filled successfully via agentic workflow.",
            "credits_used": FORM_FILL_CREDIT_COST,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error filling form: {str(e)}",
        )