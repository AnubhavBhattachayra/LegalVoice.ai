from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import motor.motor_asyncio
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Import auth utilities
from auth_utils import (
    Token, User, get_password_hash, verify_password,
    authenticate_user, create_access_token,
    get_current_user, get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Import database utilities
from db_utils import get_mongodb_client, get_db, safe_db_operation

# Setup Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Optional Firebase Admin (only if service account file is provided)
firebase_admin_available = False
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth

    firebase_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if firebase_key_path and os.path.exists(firebase_key_path):
        cred = credentials.Certificate(firebase_key_path)
        firebase_admin.initialize_app(cred)
        firebase_admin_available = True
        print("Firebase Admin initialized successfully.")
    else:
        print("Firebase service account key not found — Firebase Admin disabled.")
except ImportError:
    print("firebase-admin not installed — Firebase Admin disabled.")
except Exception as e:
    print(f"Firebase initialization warning: {e} — Firebase Admin disabled.")

# MongoDB connection state
_client = None
db = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown with the modern lifespan context manager."""
    global _client, db
    # Startup
    try:
        _client = await get_mongodb_client()
        db = _client.legalvoice
        print("Connected to MongoDB on startup.")
    except Exception as e:
        print(f"Warning: Failed to initialize MongoDB on startup: {e}")
        print("Will retry on first request.")
    yield
    # Shutdown
    if _client:
        _client.close()
        print("MongoDB connection closed.")


# Initialize FastAPI app
app = FastAPI(
    title="LegalVoice.ai API",
    description=(
        "Backend API for LegalVoice.ai — Voice-Powered Legal Assistant. "
        "Supports multilingual voice-to-text (Whisper), hybrid RAG retrieval, "
        "agentic form processing (AutoGen), and AI document drafting."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Dependency helpers
# --------------------------------------------------------------------------- #

async def _ensure_db():
    """Lazily initialise the DB if startup failed."""
    global _client, db
    if db is None:
        try:
            _client = await get_mongodb_client()
            db = _client.legalvoice
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database connection error: {str(e)}",
            )
    return db


async def get_database():
    return await _ensure_db()


async def get_user_with_db(token: str = Depends(OAuth2PasswordBearer(tokenUrl="token"))):
    await _ensure_db()
    return await get_current_user(db, token)


async def get_active_user_with_db(current_user: User = Depends(get_user_with_db)):
    return await get_current_active_user(db, current_user)


# --------------------------------------------------------------------------- #
# Auth endpoints
# --------------------------------------------------------------------------- #

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    await _ensure_db()
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/")
async def root():
    return {
        "message": "Welcome to LegalVoice.ai API v2",
        "features": [
            "Multilingual voice transcription (Whisper, 8 languages)",
            "Hybrid RAG legal document retrieval",
            "Agentic form processing (AutoGen)",
            "Chain-of-Thought document analysis",
            "AI-powered legal document drafting",
        ],
    }


@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_active_user_with_db)):
    return current_user


@app.post("/users/register")
async def register_user(username: str, email: str, password: str, full_name: str):
    await _ensure_db()
    existing_user = await db.users.find_one({"username": username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    hashed_password = get_password_hash(password)
    user_data = {
        "username": username,
        "email": email,
        "full_name": full_name,
        "hashed_password": hashed_password,
        "disabled": False,
        "role": "user",
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_data)
    return {"id": str(result.inserted_id), "username": username}


@app.post("/firebase/verify-token")
async def verify_firebase_token(token: str):
    if not firebase_admin_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase authentication is not configured on this server.",
        )
    try:
        from firebase_admin import auth as firebase_auth
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token["uid"]

        await _ensure_db()
        user = await db.users.find_one({"firebase_uid": uid})
        if not user:
            user_record = firebase_auth.get_user(uid)
            user_data = {
                "firebase_uid": uid,
                "email": user_record.email,
                "username": user_record.email.split("@")[0],
                "full_name": user_record.display_name or "",
                "disabled": False,
                "created_at": datetime.utcnow(),
            }
            await db.users.insert_one(user_data)
            username = user_data["username"]
        else:
            username = user["username"]

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# --------------------------------------------------------------------------- #
# Document analysis (Gemini, fixed model names)
# --------------------------------------------------------------------------- #

@app.post("/api/analyze-document")
async def analyze_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_active_user_with_db),
):
    try:
        file_content = await file.read()
        file_location = f"temp_{file.filename}"
        with open(file_location, "wb") as file_object:
            file_object.write(file_content)

        try:
            # Use gemini-1.5-pro for multimodal (vision) tasks
            model = genai.GenerativeModel("gemini-1.5-pro")
            with open(file_location, "rb") as img:
                response = model.generate_content(
                    [
                        "Analyze this legal document and provide a comprehensive summary "
                        "with key clauses, parties involved, important dates, and obligations.",
                        {"mime_type": file.content_type, "data": img.read()},
                    ]
                )
        finally:
            if os.path.exists(file_location):
                os.remove(file_location)

        await _ensure_db()
        analysis = {
            "user_id": current_user.id,
            "filename": file.filename,
            "summary": response.text,
            "timestamp": datetime.utcnow(),
        }
        result = await db.document_analyses.insert_one(analysis)

        return {"summary": response.text, "analysis_id": str(result.inserted_id)}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}",
        )


@app.post("/api/ask-document-question")
async def ask_document_question(
    analysis_id: str,
    question: str,
    current_user: User = Depends(get_active_user_with_db),
):
    try:
        from bson import ObjectId
        await _ensure_db()
        analysis = await db.document_analyses.find_one({"_id": ObjectId(analysis_id)})
        if not analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

        if str(analysis.get("user_id")) != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        # Chain-of-Thought legal reasoning prompt
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""You are an expert legal assistant. Use step-by-step Chain-of-Thought reasoning to answer the question.

Document Summary:
{analysis['summary']}

Question: {question}

Think through this carefully:
1. What does the document say about this topic?
2. What are the relevant legal implications?
3. What is the most accurate and helpful answer?

Provide a clear, accurate answer based on the document."""

        response = model.generate_content(prompt)

        interaction = {
            "analysis_id": analysis_id,
            "user_id": current_user.id,
            "question": question,
            "answer": response.text,
            "timestamp": datetime.utcnow(),
        }
        await db.document_questions.insert_one(interaction)

        return {"answer": response.text}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing question: {str(e)}",
        )


# --------------------------------------------------------------------------- #
# Register all routes
# --------------------------------------------------------------------------- #
from routes.init_routes import init_routes
init_routes(app)


# --------------------------------------------------------------------------- #
# Main entry point
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)