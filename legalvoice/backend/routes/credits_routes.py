from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from models import User, UserCredit, CreditTransaction, SubscriptionTier
from main import get_active_user_with_db, db

router = APIRouter(prefix="/credits", tags=["credits"])

# Define subscription tiers
SUBSCRIPTION_TIERS = {
    "Free": {
        "name": "Free",
        "monthly_price": 0,
        "document_credits": 3,
        "ai_drafting_allowed": False,
        "upload_form_filling": False,
        "complex_documents": False,
        "priority_support": False
    },
    "Basic": {
        "name": "Basic",
        "monthly_price": 499,
        "document_credits": 10,
        "ai_drafting_allowed": True,
        "upload_form_filling": True,
        "complex_documents": False,
        "priority_support": False
    },
    "Premium": {
        "name": "Premium",
        "monthly_price": 999,
        "document_credits": 25,
        "ai_drafting_allowed": True,
        "upload_form_filling": True,
        "complex_documents": True,
        "priority_support": False
    },
    "Enterprise": {
        "name": "Enterprise",
        "monthly_price": 2499,
        "document_credits": 100,
        "ai_drafting_allowed": True,
        "upload_form_filling": True,
        "complex_documents": True,
        "priority_support": True
    }
}

# Helper functions
async def get_user_credits(user_id: str) -> UserCredit:
    """Get or create user credits"""
    user_credits = await db.user_credits.find_one({"user_id": ObjectId(user_id)})
    
    if not user_credits:
        # Initialize with Free tier
        user_credits = {
            "user_id": ObjectId(user_id),
            "subscription_tier": "Free",
            "total_credits": SUBSCRIPTION_TIERS["Free"]["document_credits"],
            "used_credits": 0,
            "next_renewal_date": datetime.utcnow() + timedelta(days=30),
            "credit_history": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.user_credits.insert_one(user_credits)
        user_credits["_id"] = result.inserted_id
    
    return UserCredit(**user_credits)

async def log_credit_transaction(
    user_id: str,
    amount: int,
    transaction_type: str,
    document_id: Optional[str] = None,
    description: str = ""
) -> CreditTransaction:
    """Log a credit transaction and update user credit balance"""
    
    # Create transaction record
    transaction = {
        "user_id": ObjectId(user_id),
        "amount": amount,
        "transaction_type": transaction_type,
        "document_id": ObjectId(document_id) if document_id else None,
        "description": description,
        "created_at": datetime.utcnow()
    }
    
    # Insert transaction
    transaction_result = await db.credit_transactions.insert_one(transaction)
    
    # Update user credits
    await db.user_credits.update_one(
        {"user_id": ObjectId(user_id)},
        {
            "$inc": {"used_credits": abs(amount) if amount < 0 else 0},
            "$push": {
                "credit_history": {
                    "amount": amount,
                    "transaction_type": transaction_type,
                    "description": description,
                    "timestamp": datetime.utcnow()
                }
            },
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    transaction["_id"] = transaction_result.inserted_id
    return CreditTransaction(**transaction)

async def check_credits_available(user_id: str, required_credits: int) -> bool:
    """Check if user has enough credits available"""
    user_credits = await get_user_credits(user_id)
    available_credits = user_credits.total_credits - user_credits.used_credits
    return available_credits >= required_credits

async def check_feature_access(user_id: str, feature: str) -> bool:
    """Check if user's subscription tier allows access to a feature"""
    user_credits = await get_user_credits(user_id)
    tier = user_credits.subscription_tier
    return SUBSCRIPTION_TIERS[tier].get(feature, False)

# Routes
@router.get("/my", response_model=UserCredit)
async def get_my_credits(current_user: User = Depends(get_active_user_with_db)):
    """Get current user's credit information"""
    user_credits = await get_user_credits(current_user.id)
    return user_credits

@router.get("/subscription-tiers", response_model=Dict)
async def get_subscription_tiers():
    """Get available subscription tiers"""
    return SUBSCRIPTION_TIERS

@router.post("/upgrade", response_model=UserCredit)
async def upgrade_subscription(
    tier_data: Dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    """Upgrade user subscription to a specified tier"""
    new_tier = tier_data.get("tier")
    
    if new_tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid subscription tier: {new_tier}"
        )
    
    # Get current user credits
    user_credits = await get_user_credits(current_user.id)
    
    # Check if this is actually an upgrade
    current_price = SUBSCRIPTION_TIERS[user_credits.subscription_tier]["monthly_price"]
    new_price = SUBSCRIPTION_TIERS[new_tier]["monthly_price"]
    
    if new_price < current_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot downgrade subscription through this endpoint"
        )
    
    # Update user credits with new tier
    new_credits = SUBSCRIPTION_TIERS[new_tier]["document_credits"]
    next_renewal = datetime.utcnow() + timedelta(days=30)
    
    await db.user_credits.update_one(
        {"user_id": ObjectId(current_user.id)},
        {
            "$set": {
                "subscription_tier": new_tier,
                "total_credits": new_credits,
                "used_credits": 0,  # Reset used credits on upgrade
                "next_renewal_date": next_renewal,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Log the transaction
    await log_credit_transaction(
        user_id=current_user.id,
        amount=new_credits,
        transaction_type="subscription_upgrade",
        description=f"Upgraded to {new_tier} plan with {new_credits} credits"
    )
    
    # Return updated user credits
    updated_credits = await db.user_credits.find_one({"user_id": ObjectId(current_user.id)})
    return UserCredit(**updated_credits)

@router.get("/transactions", response_model=List[CreditTransaction])
async def get_credit_transactions(current_user: User = Depends(get_active_user_with_db)):
    """Get user's credit transaction history"""
    transactions = await db.credit_transactions.find(
        {"user_id": ObjectId(current_user.id)}
    ).sort("created_at", -1).to_list(None)
    
    return transactions

# Admin endpoint to manually add credits (for demo purposes)
@router.post("/add-credits", response_model=UserCredit)
async def add_credits(
    credit_data: Dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    """Add credits to user account (for testing purposes)"""
    
    # In production, this would have additional authorization checks
    
    amount = credit_data.get("amount", 0)
    description = credit_data.get("description", "Manual credit addition")
    
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credit amount must be positive"
        )
    
    # Get current user credits
    user_credits = await get_user_credits(current_user.id)
    
    # Update total credits
    new_total = user_credits.total_credits + amount
    
    await db.user_credits.update_one(
        {"user_id": ObjectId(current_user.id)},
        {
            "$set": {
                "total_credits": new_total,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Log the transaction
    await log_credit_transaction(
        user_id=current_user.id,
        amount=amount,
        transaction_type="manual_addition",
        description=description
    )
    
    # Return updated user credits
    updated_credits = await db.user_credits.find_one({"user_id": ObjectId(current_user.id)})
    return UserCredit(**updated_credits) 