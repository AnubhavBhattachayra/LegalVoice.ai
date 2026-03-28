from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional, Dict
from datetime import datetime
from models import DocumentTemplate, UserDocument
from main import get_active_user_with_db, db, genai
from models import User
from bson import ObjectId

router = APIRouter(prefix="/documents", tags=["documents"])

# Get all document templates
@router.get("/templates", response_model=List[DocumentTemplate])
async def get_document_templates(
    category: Optional[str] = None,
    language: Optional[str] = None,
    current_user: User = Depends(get_active_user_with_db)
):
    # Build query conditions
    query = {}
    if category:
        query["category"] = category
    if language:
        query["language"] = language
    
    templates = await db.document_templates.find(query).to_list(None)
    return templates

# Get specific document template
@router.get("/templates/{template_id}", response_model=DocumentTemplate)
async def get_document_template(
    template_id: str,
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        template = await db.document_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {template_id} not found"
            )
        return template
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Create user document from template
@router.post("/create", response_model=UserDocument)
async def create_user_document(
    document_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        template_id = document_data.get("template_id")
        
        # Verify template exists
        template = await db.document_templates.find_one({"_id": ObjectId(template_id)})
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {template_id} not found"
            )
        
        # Create user document
        user_document = {
            "user_id": ObjectId(current_user.id),
            "document_name": document_data.get("document_name", template.get("name", "Untitled Document")),
            "document_type": template.get("name"),
            "content": document_data.get("content", {}),
            "status": "draft",
            "shared_with": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.user_documents.insert_one(user_document)
        user_document["_id"] = result.inserted_id
        
        return user_document
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Get user's documents
@router.get("/my-documents", response_model=List[UserDocument])
async def get_my_documents(
    status: Optional[str] = None,
    current_user: User = Depends(get_active_user_with_db)
):
    query = {"user_id": ObjectId(current_user.id)}
    
    if status:
        query["status"] = status
    
    documents = await db.user_documents.find(query).to_list(None)
    return documents

# Get specific user document
@router.get("/{document_id}", response_model=UserDocument)
async def get_user_document(
    document_id: str,
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        # Get document with authorization check
        document = await db.user_documents.find_one({
            "_id": ObjectId(document_id),
            "$or": [
                {"user_id": ObjectId(current_user.id)},
                {"shared_with": {"$in": [ObjectId(current_user.id)]}}
            ]
        })
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found or not authorized to access"
            )
            
        return document
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Update user document
@router.put("/{document_id}", response_model=UserDocument)
async def update_user_document(
    document_id: str,
    document_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        # Check if document exists and user owns it
        document = await db.user_documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found or not authorized to modify"
            )
        
        # Update document
        update_data = {
            "document_name": document_data.get("document_name", document.get("document_name")),
            "content": document_data.get("content", document.get("content", {})),
            "status": document_data.get("status", document.get("status")),
            "updated_at": datetime.utcnow()
        }
        
        await db.user_documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": update_data}
        )
        
        # Get updated document
        updated_document = await db.user_documents.find_one({"_id": ObjectId(document_id)})
        
        return updated_document
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Share document with another user
@router.post("/{document_id}/share", response_model=UserDocument)
async def share_document(
    document_id: str,
    share_data: dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        # Check if document exists and user owns it
        document = await db.user_documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found or not authorized to share"
            )
        
        # Get user to share with
        share_with_username = share_data.get("username")
        share_with_user = await db.users.find_one({"username": share_with_username})
        
        if not share_with_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {share_with_username} not found"
            )
        
        # Check if already shared
        if ObjectId(share_with_user["_id"]) in [ObjectId(uid) for uid in document.get("shared_with", [])]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document already shared with {share_with_username}"
            )
        
        # Update shared_with list
        await db.user_documents.update_one(
            {"_id": ObjectId(document_id)},
            {
                "$push": {"shared_with": ObjectId(share_with_user["_id"])},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Get updated document
        updated_document = await db.user_documents.find_one({"_id": ObjectId(document_id)})
        
        return updated_document
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Get document explanation (with Gemini)
@router.post("/{document_id}/explain", response_model=Dict)
async def explain_document(
    document_id: str,
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        # Get document with authorization check
        document = await db.user_documents.find_one({
            "_id": ObjectId(document_id),
            "$or": [
                {"user_id": ObjectId(current_user.id)},
                {"shared_with": {"$in": [ObjectId(current_user.id)]}}
            ]
        })
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found or not authorized to access"
            )
        
        # Extract document content
        doc_type = document.get("document_type", "legal document")
        doc_content = document.get("content", {})
        
        # Convert content to string representation
        content_str = "\n".join([f"{key}: {value}" for key, value in doc_content.items()])
        
        # Generate explanation with Gemini
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = f"""
        As a legal expert, explain the following {doc_type} in simple terms:
        
        {content_str}
        
        Provide:
        1. A simple explanation of what this document is
        2. Key terms and what they mean
        3. Important points that the user should be aware of
        """
        
        response = model.generate_content(prompt)
        
        return {
            "document_id": document_id,
            "explanation": response.text
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating explanation: {str(e)}"
        )

# Delete user document
@router.delete("/{document_id}", response_model=Dict)
async def delete_user_document(
    document_id: str,
    current_user: User = Depends(get_active_user_with_db)
):
    try:
        # Check if document exists and user owns it
        document = await db.user_documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found or not authorized to delete"
            )
        
        # Delete document
        await db.user_documents.delete_one({"_id": ObjectId(document_id)})
        
        return {"message": f"Document {document_id} successfully deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) 