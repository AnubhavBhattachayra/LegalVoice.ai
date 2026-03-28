from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional, Dict
from datetime import datetime
import sys
import os

# Add the parent directory to the path to allow absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import User, UserUpdate
from auth_utils import get_password_hash, verify_password
from main import db, get_active_user_with_db
from bson import ObjectId

# Create a dependency that gets the current user
async def get_current_user():
    # This is a placeholder - the actual implementation 
    # will come from main.py after circular imports are resolved
    pass

# Create get_current_active_user as a placeholder
async def get_current_active_user():
    # This is a placeholder - the actual implementation
    # will come from main.py after circular imports are resolved
    pass

router = APIRouter(prefix="/users", tags=["users"])

# Get current user profile
@router.get("/me", response_model=User)
async def get_current_user_profile(
    current_user: User = Depends(get_active_user_with_db)
):
    return current_user

# Update user profile
@router.put("/me", response_model=User)
async def update_user_profile(
    update_data: UserUpdate = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        # Build update dictionary with only provided fields
        update_dict = {}
        
        if update_data.username is not None:
            # Check if username is already taken
            if update_data.username != current_user.username:
                existing_user = await db.users.find_one({"username": update_data.username})
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Username already taken"
                    )
            update_dict["username"] = update_data.username
            
        if update_data.email is not None:
            # Check if email is already taken
            if update_data.email != current_user.email:
                existing_user = await db.users.find_one({"email": update_data.email})
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )
            update_dict["email"] = update_data.email
            
        if update_data.full_name is not None:
            update_dict["full_name"] = update_data.full_name
            
        if update_data.profile_image is not None:
            update_dict["profile_image"] = update_data.profile_image
            
        update_dict["updated_at"] = datetime.utcnow()
        
        # Update user in database
        if update_dict:
            await db.users.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$set": update_dict}
            )
            
        # Get updated user
        updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
        
        return updated_user
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Change password
@router.post("/change-password", response_model=Dict)
async def change_password(
    password_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        current_password = password_data.get("current_password")
        new_password = password_data.get("new_password")
        
        if not current_password or not new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both current and new password are required"
            )
            
        # Get user with password
        user_with_password = await db.users.find_one({"_id": ObjectId(current_user.id)})
        
        # Verify current password
        if not verify_password(current_password, user_with_password.get("hashed_password")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
            
        # Hash new password
        hashed_password = get_password_hash(new_password)
        
        # Update password
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Password updated successfully"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Admin: Get all users (only accessible by admins)
@router.get("/", response_model=List[User])
async def get_all_users(
    current_user: User = Depends(get_active_user_with_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
        
    users = await db.users.find({}).to_list(None)
    return users

# Admin: Update user (only accessible by admins)
@router.put("/{user_id}", response_model=User)
async def admin_update_user(
    user_id: str,
    update_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
        
    try:
        # Check if user exists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
            
        # Update user
        update_dict = {}
        
        if "username" in update_data:
            # Check if username is already taken
            if update_data["username"] != user.get("username"):
                existing_user = await db.users.find_one({"username": update_data["username"]})
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Username already taken"
                    )
            update_dict["username"] = update_data["username"]
            
        if "email" in update_data:
            # Check if email is already taken
            if update_data["email"] != user.get("email"):
                existing_user = await db.users.find_one({"email": update_data["email"]})
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )
            update_dict["email"] = update_data["email"]
            
        if "full_name" in update_data:
            update_dict["full_name"] = update_data["full_name"]
            
        if "role" in update_data:
            update_dict["role"] = update_data["role"]
            
        if "disabled" in update_data:
            update_dict["disabled"] = update_data["disabled"]
            
        update_dict["updated_at"] = datetime.utcnow()
        
        # Update user in database
        if update_dict:
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_dict}
            )
            
        # Get updated user
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        return updated_user
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Admin: Reset user password (only accessible by admins)
@router.post("/{user_id}/reset-password", response_model=Dict)
async def admin_reset_password(
    user_id: str,
    password_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
        
    try:
        # Check if user exists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
            
        new_password = password_data.get("new_password")
        if not new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password is required"
            )
            
        # Hash new password
        hashed_password = get_password_hash(new_password)
        
        # Update password
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": f"Password for user {user_id} reset successfully"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) 