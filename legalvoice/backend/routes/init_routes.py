from fastapi import FastAPI
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routes.user_routes import router as user_router
from routes.lawyer_routes import router as lawyer_router
from routes.document_routes import router as document_router
from routes.analysis_routes import router as analysis_router
from routes.chat_routes import router as chat_router
from routes.credits_routes import router as credits_router
from routes.document_drafting_routes import router as document_drafting_router
from routes.form_upload_routes import router as form_upload_router
from routes.voice_routes import router as voice_router
from routes.rag_routes import router as rag_router


def init_routes(app: FastAPI):
    """Initialize all routes in the FastAPI application."""
    app.include_router(user_router)
    app.include_router(lawyer_router)
    app.include_router(document_router)
    app.include_router(analysis_router)
    app.include_router(chat_router)
    app.include_router(credits_router)
    app.include_router(document_drafting_router)
    app.include_router(form_upload_router)
    app.include_router(voice_router)       # NEW: Whisper voice processing
    app.include_router(rag_router)          # NEW: Hybrid RAG retrieval