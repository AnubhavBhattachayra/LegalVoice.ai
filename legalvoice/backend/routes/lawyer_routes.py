from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional
from datetime import datetime, timedelta
from models import LawyerProfile, Education, LawyerConsultation, LawyerReview, BookingStatus
from main import get_active_user_with_db, db
from models import User
from bson import ObjectId

router = APIRouter(prefix="/lawyers", tags=["lawyers"])

# Get all lawyers
@router.get("/", response_model=List[LawyerProfile])
async def get_all_lawyers(
    specialization: Optional[str] = None,
    min_experience: Optional[int] = None,
    language: Optional[str] = None,
    current_user: User = Depends(get_active_user_with_db)
):
    # Build query conditions
    query = {}
    if specialization:
        query["specialization"] = {"$in": [specialization]}
    if min_experience:
        query["years_of_experience"] = {"$gte": min_experience}
    if language:
        query["languages"] = {"$in": [language]}
    
    # Fetch lawyers from database
    lawyers = await db.lawyer_profiles.find(query).to_list(None)
    
    return lawyers

# Get lawyer by ID
@router.get("/{lawyer_id}", response_model=LawyerProfile)
async def get_lawyer_by_id(
    lawyer_id: str,
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        lawyer = await db.lawyer_profiles.find_one({"_id": ObjectId(lawyer_id)})
        if not lawyer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lawyer with ID {lawyer_id} not found"
            )
        return lawyer
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Create lawyer profile
@router.post("/profile", response_model=LawyerProfile)
async def create_lawyer_profile(
    lawyer_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    # Verify that the user is a lawyer
    if current_user.role != "lawyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with lawyer role can create a lawyer profile"
        )
    
    # Check if profile already exists
    existing_profile = await db.lawyer_profiles.find_one({"user_id": ObjectId(current_user.id)})
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lawyer profile already exists for this user"
        )
    
    # Create the lawyer profile
    lawyer_profile = {
        "user_id": ObjectId(current_user.id),
        "specialization": lawyer_data.get("specialization", []),
        "years_of_experience": lawyer_data.get("years_of_experience", 0),
        "languages": lawyer_data.get("languages", []),
        "bar_association_id": lawyer_data.get("bar_association_id", ""),
        "education": lawyer_data.get("education", []),
        "about": lawyer_data.get("about", ""),
        "hourly_rate": lawyer_data.get("hourly_rate", 0.0),
        "availability": lawyer_data.get("availability", {}),
        "ratings": 0.0,
        "review_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    result = await db.lawyer_profiles.insert_one(lawyer_profile)
    lawyer_profile["_id"] = result.inserted_id
    
    # Also update user role if not already a lawyer
    if current_user.role != "lawyer":
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"role": "lawyer", "updated_at": datetime.utcnow()}}
        )
    
    return lawyer_profile

# Update lawyer profile
@router.put("/profile", response_model=LawyerProfile)
async def update_lawyer_profile(
    lawyer_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    # Verify that the user is a lawyer
    if current_user.role != "lawyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with lawyer role can update a lawyer profile"
        )
    
    # Check if profile exists
    existing_profile = await db.lawyer_profiles.find_one({"user_id": ObjectId(current_user.id)})
    if not existing_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lawyer profile not found for this user"
        )
    
    # Update the lawyer profile
    update_data = {
        "specialization": lawyer_data.get("specialization", existing_profile.get("specialization", [])),
        "years_of_experience": lawyer_data.get("years_of_experience", existing_profile.get("years_of_experience", 0)),
        "languages": lawyer_data.get("languages", existing_profile.get("languages", [])),
        "bar_association_id": lawyer_data.get("bar_association_id", existing_profile.get("bar_association_id", "")),
        "education": lawyer_data.get("education", existing_profile.get("education", [])),
        "about": lawyer_data.get("about", existing_profile.get("about", "")),
        "hourly_rate": lawyer_data.get("hourly_rate", existing_profile.get("hourly_rate", 0.0)),
        "availability": lawyer_data.get("availability", existing_profile.get("availability", {})),
        "updated_at": datetime.utcnow()
    }
    
    await db.lawyer_profiles.update_one(
        {"user_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    # Get updated profile
    updated_profile = await db.lawyer_profiles.find_one({"user_id": ObjectId(current_user.id)})
    
    return updated_profile

# Book a consultation
@router.post("/book-consultation", response_model=LawyerConsultation)
async def book_consultation(
    consultation_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        lawyer_id = consultation_data.get("lawyer_id")
        
        # Verify lawyer exists
        lawyer = await db.lawyer_profiles.find_one({"_id": ObjectId(lawyer_id)})
        if not lawyer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lawyer with ID {lawyer_id} not found"
            )
        
        # Create consultation booking
        booking = {
            "user_id": ObjectId(current_user.id),
            "lawyer_id": ObjectId(lawyer_id),
            "date": datetime.fromisoformat(consultation_data.get("date")),
            "duration_minutes": consultation_data.get("duration_minutes", 60),
            "mode": consultation_data.get("mode", "video"),
            "status": BookingStatus.PENDING,
            "topic": consultation_data.get("topic", "Legal Consultation"),
            "description": consultation_data.get("description"),
            "documents": [ObjectId(doc_id) for doc_id in consultation_data.get("documents", [])],
            "created_at": datetime.utcnow()
        }
        
        result = await db.consultations.insert_one(booking)
        booking["_id"] = result.inserted_id
        booking["booking_id"] = str(booking.get("_id"))
        
        return booking
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Get user's consultations
@router.get("/my-consultations", response_model=List[LawyerConsultation])
async def get_my_consultations(
    status: Optional[str] = None,
    current_user: User = Depends(get_active_user_with_db)
):
    query = {"user_id": ObjectId(current_user.id)}
    
    if status:
        query["status"] = status
    
    consultations = await db.consultations.find(query).to_list(None)
    
    return consultations

# Get lawyer's consultations
@router.get("/consultations-as-lawyer", response_model=List[LawyerConsultation])
async def get_consultations_as_lawyer(
    status: Optional[str] = None,
    current_user: User = Depends(get_active_user_with_db)
):
    # Verify that the user is a lawyer
    if current_user.role != "lawyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lawyers can access this endpoint"
        )
    
    # Find the lawyer profile
    lawyer_profile = await db.lawyer_profiles.find_one({"user_id": ObjectId(current_user.id)})
    if not lawyer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lawyer profile not found for this user"
        )
    
    query = {"lawyer_id": lawyer_profile["_id"]}
    
    if status:
        query["status"] = status
    
    consultations = await db.consultations.find(query).to_list(None)
    
    return consultations

# Update consultation status
@router.put("/consultation/{consultation_id}", response_model=LawyerConsultation)
async def update_consultation(
    consultation_id: str,
    action: str,  # confirm, cancel, complete, reschedule
    new_date: Optional[str] = None,
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        # Get the consultation
        consultation = await db.consultations.find_one({"_id": ObjectId(consultation_id)})
        if not consultation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Consultation with ID {consultation_id} not found"
            )
        
        # Check if user is authorized
        is_client = str(consultation["user_id"]) == str(current_user.id)
        
        lawyer_profile = await db.lawyer_profiles.find_one({"user_id": ObjectId(current_user.id)})
        is_lawyer = lawyer_profile and str(consultation["lawyer_id"]) == str(lawyer_profile["_id"])
        
        if not (is_client or is_lawyer):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this consultation"
            )
        
        # Update based on action
        update_data = {}
        
        if action == "confirm" and is_lawyer:
            update_data["status"] = BookingStatus.CONFIRMED
            # Generate a meeting link (in a real app, integrate with Zoom/Google Meet API)
            update_data["meeting_link"] = f"https://meet.legalvoice.ai/{consultation_id}"
            
        elif action == "cancel":
            update_data["status"] = BookingStatus.CANCELLED
            
        elif action == "complete" and is_lawyer:
            update_data["status"] = BookingStatus.COMPLETED
            
        elif action == "reschedule" and new_date:
            update_data["date"] = datetime.fromisoformat(new_date)
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid action '{action}' or missing required parameters"
            )
        
        update_data["updated_at"] = datetime.utcnow()
        
        await db.consultations.update_one(
            {"_id": ObjectId(consultation_id)},
            {"$set": update_data}
        )
        
        # Get updated consultation
        updated_consultation = await db.consultations.find_one({"_id": ObjectId(consultation_id)})
        
        return updated_consultation
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Submit a review for a lawyer
@router.post("/review", response_model=LawyerReview)
async def submit_review(
    review_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        lawyer_id = review_data.get("lawyer_id")
        consultation_id = review_data.get("consultation_id")
        
        # Verify lawyer exists
        lawyer = await db.lawyer_profiles.find_one({"_id": ObjectId(lawyer_id)})
        if not lawyer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lawyer with ID {lawyer_id} not found"
            )
        
        # Verify consultation exists and belongs to user
        consultation = await db.consultations.find_one({
            "_id": ObjectId(consultation_id),
            "user_id": ObjectId(current_user.id),
            "lawyer_id": ObjectId(lawyer_id)
        })
        
        if not consultation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Consultation not found or you are not authorized to review it"
            )
        
        # Check if consultation is completed
        if consultation["status"] != BookingStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can only review completed consultations"
            )
        
        # Check if already reviewed
        existing_review = await db.lawyer_reviews.find_one({
            "consultation_id": ObjectId(consultation_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this consultation"
            )
        
        # Create review
        review = {
            "lawyer_id": ObjectId(lawyer_id),
            "user_id": ObjectId(current_user.id),
            "consultation_id": ObjectId(consultation_id),
            "rating": review_data.get("rating", 5.0),
            "review_text": review_data.get("review_text", ""),
            "created_at": datetime.utcnow()
        }
        
        result = await db.lawyer_reviews.insert_one(review)
        review["_id"] = result.inserted_id
        
        # Update lawyer's rating
        all_reviews = await db.lawyer_reviews.find({"lawyer_id": ObjectId(lawyer_id)}).to_list(None)
        total_ratings = sum(r["rating"] for r in all_reviews)
        new_rating = total_ratings / len(all_reviews)
        
        await db.lawyer_profiles.update_one(
            {"_id": ObjectId(lawyer_id)},
            {
                "$set": {
                    "ratings": new_rating,
                    "review_count": len(all_reviews)
                }
            }
        )
        
        return review
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Get reviews for a lawyer
@router.get("/{lawyer_id}/reviews", response_model=List[LawyerReview])
async def get_lawyer_reviews(
    lawyer_id: str,
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        reviews = await db.lawyer_reviews.find({"lawyer_id": ObjectId(lawyer_id)}).to_list(None)
        return reviews
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) 