from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_serializer
from typing import List, Optional, Dict, Any, Annotated, ClassVar
from datetime import datetime
from bson import ObjectId
import uuid
from pydantic_core import core_schema

# Custom ObjectId field
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, (str, ObjectId)):
            raise ValueError("Not a valid ObjectId type")
        
        if isinstance(v, str):
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId format")
            return ObjectId(v)
        return v
    
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.with_info_plain_validator_function(cls.validate)
            ])
        ])


# Base model with custom ID field
class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True
    )
    
    @field_serializer('id')
    def serialize_id(self, id: Optional[PyObjectId]) -> Optional[str]:
        return str(id) if id else None


# User models
class User(MongoBaseModel):
    username: str
    email: str
    full_name: str
    role: str = "user"  # Options: "user", "lawyer", "admin"
    profile_image: Optional[str] = None
    firebase_uid: Optional[str] = None
    disabled: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "user"


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    profile_image: Optional[str] = None
    disabled: Optional[bool] = None


class UserInDB(User):
    hashed_password: str


# Lawyer Profile
class Education(BaseModel):
    institution: str
    degree: str
    year: int


class LawyerProfile(MongoBaseModel):
    user_id: PyObjectId
    specialization: List[str]
    years_of_experience: int
    languages: List[str]
    bar_association_id: str
    education: List[Education]
    about: str
    hourly_rate: float
    availability: Dict[str, List[str]]  # Day -> time slots
    ratings: float = 0.0
    review_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# Document models
class DocumentTemplate(MongoBaseModel):
    name: str
    description: str
    category: str
    language: str = "English"
    fields: List[Dict[str, Any]]
    template_data: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class UserDocument(MongoBaseModel):
    user_id: PyObjectId
    document_name: str
    document_type: str
    content: Dict
    status: str = "draft"  # draft, completed, shared
    shared_with: List[PyObjectId] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# Document Analysis
class DocumentAnalysis(MongoBaseModel):
    user_id: PyObjectId
    filename: str
    file_path: Optional[str] = None
    document_type: Optional[str] = None
    summary: str
    key_points: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnalysisQuestion(MongoBaseModel):
    analysis_id: PyObjectId
    user_id: PyObjectId
    question: str
    answer: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Consultation/Booking
class BookingStatus(str):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class LawyerConsultation(MongoBaseModel):
    booking_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: PyObjectId
    lawyer_id: PyObjectId
    date: datetime
    duration_minutes: int
    mode: str  # "video", "voice", "chat", "in-person"
    status: BookingStatus = BookingStatus.PENDING
    topic: str
    description: Optional[str] = None
    documents: Optional[List[PyObjectId]] = None  # References to UserDocument
    amount_paid: float = 0.0
    meeting_link: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# Review and Ratings
class LawyerReview(MongoBaseModel):
    lawyer_id: PyObjectId
    user_id: PyObjectId
    consultation_id: PyObjectId
    rating: float  # 1-5
    review_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Chat model
class ChatMessage(MongoBaseModel):
    consultation_id: PyObjectId
    sender_id: PyObjectId
    is_lawyer: bool
    message: str
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Payment models
class PaymentStatus(str):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(MongoBaseModel):
    user_id: PyObjectId
    consultation_id: Optional[PyObjectId] = None
    amount: float
    currency: str = "INR"
    payment_method: str
    status: PaymentStatus = PaymentStatus.PENDING
    transaction_id: Optional[str] = None
    payment_details: Optional[Dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# Credit System models
class CreditTransaction(BaseModel):
    amount: int  # Positive for added credits, negative for used credits
    transaction_type: str  # 'subscription', 'document_generation', 'form_processing', etc.
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "amount": -2,
                "transaction_type": "ai_document_generation",
                "description": "Generated power of attorney document",
                "timestamp": datetime.utcnow()
            }
        }
    )

class SubscriptionTier(BaseModel):
    id: str
    name: str
    monthly_price: float
    document_credits: int
    features: Dict[str, bool]
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "premium",
                "name": "Premium",
                "monthly_price": 999.0,
                "document_credits": 50,
                "features": {
                    "ai_drafting_allowed": True,
                    "complex_documents": True,
                    "form_uploads": True,
                    "premium_support": True
                }
            }
        }
    )

class UserCredit(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: str
    subscription_tier: str
    total_credits: int
    used_credits: int
    next_renewal_date: datetime
    credit_history: List[CreditTransaction] = []
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "user_id": "60d9b8b9f5b5e8a5e8b4567c",
                "subscription_tier": "premium",
                "total_credits": 50,
                "used_credits": 5,
                "next_renewal_date": datetime.utcnow(),
                "credit_history": [
                    {
                        "amount": 50,
                        "transaction_type": "subscription",
                        "description": "Monthly subscription credits",
                        "timestamp": datetime.utcnow()
                    },
                    {
                        "amount": -2,
                        "transaction_type": "ai_document_generation",
                        "description": "Generated power of attorney document",
                        "timestamp": datetime.utcnow()
                    }
                ]
            }
        }
    )

# AI Document Generation models
class ConversationMessage(BaseModel):
    role: str  # 'system', 'user', or 'assistant'
    content: str
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "role": "user",
                "content": "I need to create a rental agreement for my apartment."
            }
        }
    )

class DocumentDraftingSession(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: str
    document_type: str
    conversation_history: List[ConversationMessage]
    document_data: Dict[str, Any] = {}
    draft_content: Optional[str] = None
    status: str  # 'in_progress', 'completed'
    credit_cost: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "user_id": "60d9b8b9f5b5e8a5e8b4567c",
                "document_type": "rent",
                "conversation_history": [
                    {"role": "user", "content": "I need to create a rental agreement for my apartment."},
                    {"role": "assistant", "content": "I'll help you with that. What's the address of the rental property?"}
                ],
                "status": "in_progress",
                "credit_cost": 1,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )

class FormUpload(MongoBaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: str
    filename: str
    form_type: Optional[str] = None
    extracted_text: str
    extracted_fields: Dict[str, Any]
    status: str  # 'processed', 'filled'
    filled_data: Optional[Dict[str, Any]] = None
    credit_cost: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "user_id": "60d9b8b9f5b5e8a5e8b4567c",
                "filename": "legal_form.pdf",
                "form_type": "Affidavit",
                "extracted_text": "This is the raw OCR text from the form",
                "extracted_fields": {"name": "", "address": ""},
                "status": "processed",
                "credit_cost": 3,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )

class DocumentTemplateGuidelines(MongoBaseModel):
    """Model to store guidelines for various document types"""
    document_type: str
    guidelines: Dict[str, Any]
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "document_type": "patent",
                "guidelines": {
                    "patentWritingGuidelines": {
                        "title": {
                            "description": "Brief title for the invention",
                            "requirements": [
                                "Should be free from fancy expressions or ambiguity",
                                "Should be precise and definite",
                                "Should not exceed 15 words"
                            ]
                        }
                    }
                },
                "version": 1
            }
        }
    )


# --------------------------------------------------------- #
# Voice Processing Models
# --------------------------------------------------------- #
class VoiceSession(MongoBaseModel):
    """Records a Whisper voice transcription + optional legal query session."""
    user_id: PyObjectId
    session_id: str
    audio_filename: Optional[str] = None
    transcript: str
    detected_language: str = "en"
    requested_language: Optional[str] = None
    legal_response: Optional[str] = None
    segments: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "user_id": "60d9b8b9f5b5e8a5e8b4567c",
                "session_id": "voice_session_abc123",
                "audio_filename": "query.wav",
                "transcript": "मुझे किराया समझौता चाहिए",
                "detected_language": "hi",
                "legal_response": "किराया समझौते के लिए निम्नलिखित जानकारी चाहिए...",
            }
        },
    )


# --------------------------------------------------------- #
# RAG Document Models
# --------------------------------------------------------- #
class RAGDocument(MongoBaseModel):
    """Legal document indexed in the hybrid RAG retrieval system."""
    user_id: str
    title: str
    doc_type: str = "general"
    full_text: Optional[str] = None
    chunks: List[str] = []
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "user_id": "60d9b8b9f5b5e8a5e8b4567c",
                "title": "Standard Rent Agreement - Mumbai",
                "doc_type": "rent_agreement",
                "chunks": ["This agreement is entered into...", "The monthly rent shall be..."],
                "metadata": {"jurisdiction": "Maharashtra", "year": 2024},
            }
        },
    )