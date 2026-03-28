from fastapi import APIRouter, Depends, HTTPException, status, Body, File, UploadFile
from typing import List, Dict, Optional, Any
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
import os
import google.generativeai as genai
import json

from models import (
    User, DocumentDraftingSession, ConversationMessage, 
    FormUpload, UserDocument
)
from main import get_active_user_with_db, db, genai
from routes.credits_routes import (
    get_user_credits, log_credit_transaction, 
    check_credits_available, check_feature_access
)

router = APIRouter(prefix="/ai-drafting", tags=["ai-drafting"])

# Credit costs for different operations
CREDIT_COSTS = {
    "start_session": 1,
    "generate_draft": 2,
    "complex_document": 5,
    "form_upload_processing": 3,
    "form_filling": 2
}

# Document types that are considered complex
COMPLEX_DOCUMENT_TYPES = [
    "will", "partnership-deed", "patent-application", 
    "trademark-application", "legal-notice", "divorce-petition"
]

# Helper functions for working with Gemini API
async def get_structured_gemini_response(
    prompt: str, 
    response_structure: Dict[str, Any],
    system_instruction: str = ""
) -> Dict:
    """Get a structured response from Gemini API"""
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Create structured prompt
        structured_prompt = f"""
        {system_instruction}
        
        {prompt}
        
        Provide your response as a JSON object with the following structure:
        {json.dumps(response_structure, indent=2)}
        
        Your response should be valid JSON that I can parse programmatically.
        """
        
        # Generate response with more nuanced thinking
        response = model.generate_content(
            structured_prompt,
            generation_config={"temperature": 0.2, "max_output_tokens": 2048}
        )
        
        # Extract and parse JSON response
        result_text = response.text
        
        # Find JSON content between triple backticks if present
        if "```json" in result_text and "```" in result_text.split("```json", 1)[1]:
            json_content = result_text.split("```json", 1)[1].split("```", 1)[0]
        elif "```" in result_text:
            json_content = result_text.split("```", 1)[1].split("```", 1)[0]
        else:
            json_content = result_text
            
        # Clean up and parse
        try:
            result = json.loads(json_content.strip())
            return result
        except json.JSONDecodeError:
            # Fallback to more aggressive cleanup if parsing fails
            cleaned_content = json_content.replace('\n', '').replace('\r', '')
            return json.loads(cleaned_content)
            
    except Exception as e:
        print(f"Error getting structured response: {str(e)}")
        raise ValueError(f"Failed to get structured response: {str(e)}")

# Routes
@router.post("/start-session", response_model=DocumentDraftingSession)
async def start_drafting_session(
    session_data: Dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    """Start a new document drafting session"""
    document_type = session_data.get("document_type", "")
    initial_message = session_data.get("initial_message", "")
    
    # Check if user has AI drafting feature access
    has_access = await check_feature_access(current_user.id, "ai_drafting_allowed")
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your subscription does not include AI document drafting. Please upgrade to access this feature."
        )
    
    # Calculate credit cost
    credit_cost = CREDIT_COSTS["start_session"]
    if document_type in COMPLEX_DOCUMENT_TYPES:
        # Check if complex documents are allowed in user's tier
        complex_allowed = await check_feature_access(current_user.id, "complex_documents")
        if not complex_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your subscription does not include complex document drafting. Please upgrade to access this feature."
            )
        credit_cost += CREDIT_COSTS["complex_document"]
    
    # Check if user has enough credits
    has_credits = await check_credits_available(current_user.id, credit_cost)
    if not has_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="You don't have enough credits for this operation. Please upgrade your subscription or add more credits."
        )
    
    # Create initial conversation with system message and user message
    conversation_history = [
        {
            "role": "system",
            "content": f"You are a legal assistant specialized in creating {document_type} documents. Ask focused questions to gather all the necessary information for drafting this document properly in Indian legal context."
        },
        {
            "role": "user",
            "content": initial_message
        }
    ]
    
    # Get first response from Gemini
    try:
        system_instruction = (
            f"You are an expert legal assistant specializing in Indian law and legal documents. "
            f"You are helping a user draft a {document_type} document by gathering relevant information "
            f"through a conversation. Ask focused questions to collect all necessary information required "
            f"for a proper {document_type} document. Be thorough, professional, and step-by-step. "
            f"Do not draft the document yet — just gather information."
        )
        model = genai.GenerativeModel('gemini-2.0-flash', system_instruction=system_instruction)
        
        # If patent application, get patent guidelines and include them
        if document_type == "patent-application":
            try:
                patent_guidelines = await db.document_template_guidelines.find_one({"document_type": "patent"})
                if patent_guidelines and "guidelines" in patent_guidelines:
                    # Add patent writing guidelines to system instruction
                    patent_data = patent_guidelines["guidelines"]
                    system_instruction += f"""
                    Use the following patent writing guidelines to structure your questions and gather information:
                    
                    Patent Writing Guidelines:
                    {json.dumps(patent_data, indent=2)}
                    
                    Follow these guidelines carefully and collect information for each section systematically.
                    """
                    # Update the conversation history system message
                    conversation_history[0]["content"] = system_instruction
            except Exception as e:
                print(f"Error fetching patent guidelines: {str(e)}")
                # Continue without guidelines if there's an error
        
        # Generate first assistant response
        if document_type == "patent-application":
            try:
                # Get patent guidelines
                patent_guidelines = await db.document_template_guidelines.find_one({"document_type": "patent"})
                
                # Check if initial message is minimal (less than 50 words)
                is_minimal_info = len(initial_message.split()) < 50
                
                if is_minimal_info:
                    # If minimal information, provide structured prompts to gather all needed information
                    structured_prompt = """
                    I'll help you draft a patent application. To create a comprehensive patent document, I'll need to gather information about your invention step by step.
                    
                    Let's start with some basic information:
                    
                    1. What is the title of your invention? (Keep it brief, precise, and under 15 words)
                    2. What technical field does your invention belong to?
                    3. Can you briefly describe the problem your invention solves?
                    
                    Once you provide these details, I'll guide you through each section of the patent application.
                    """
                    
                    # Add rich patent guidelines information if available
                    if patent_guidelines and "guidelines" in patent_guidelines:
                        patent_data = patent_guidelines["guidelines"]
                        if "patentWritingGuidelines" in patent_data:
                            guidelines = patent_data["patentWritingGuidelines"]
                            
                            # Add title requirements if available
                            if "title" in guidelines and "requirements" in guidelines["title"]:
                                title_reqs = guidelines["title"]["requirements"]
                                structured_prompt += "\n\nFor the title, please note the following requirements:\n- " + "\n- ".join(title_reqs)
                    
                    first_response = structured_prompt
                else:
                    # Normal processing for more detailed initial messages
                    first_response = model.generate_content(initial_message).text
            except Exception as e:
                print(f"Error with patent application handling: {str(e)}")
                # Fall back to standard generation
                first_response = model.generate_content(initial_message).text
        else:
            # Standard generation for non-patent document types
            first_response = model.generate_content(initial_message).text
        
        assistant_message = {
            "role": "assistant",
            "content": first_response
        }
        
        conversation_history.append(assistant_message)
        
        # Create session record
        session = {
            "user_id": ObjectId(current_user.id),
            "document_type": document_type,
            "conversation_history": conversation_history,
            "document_data": {},
            "draft_content": None,
            "status": "in_progress",
            "credit_cost": credit_cost,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.document_drafting_sessions.insert_one(session)
        session_id = result.inserted_id
        
        # Log credit transaction
        await log_credit_transaction(
            user_id=current_user.id,
            amount=-credit_cost,
            transaction_type="ai_drafting_start",
            description=f"Started AI drafting session for {document_type}"
        )
        
        # Return session with ID
        session["_id"] = session_id
        return session
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting drafting session: {str(e)}"
        )

@router.post("/{session_id}/message", response_model=Dict)
async def add_message_to_session(
    session_id: str,
    message_data: Dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    """Add a message to an existing drafting session and get AI response"""
    try:
        # Get session and verify ownership
        session = await db.document_drafting_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Drafting session not found or you don't have access to it"
            )
            
        if session["status"] != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Session is in {session['status']} status and cannot be modified"
            )
            
        # Add user message to conversation history
        user_message = {
            "role": "user",
            "content": message_data.get("message", "")
        }
        
        conversation_history = session["conversation_history"]
        conversation_history.append(user_message)
        
        # Prepare conversation for Gemini API
        gemini_messages = []
        system_instruction = f"""
        You are an expert legal assistant specializing in Indian law and legal documents. 
        You are helping a user draft a {session['document_type']} document by gathering relevant information through a conversation.
        Ask focused questions to collect all the necessary information required for a proper {session['document_type']} document.
        Be thorough in your information gathering, maintaining a professional tone.
        Your goal is to gather complete and accurate information through a step-by-step conversation.
        Do not draft the document yet, just gather information.
        If you believe you have gathered all necessary information, ask the user if they would like to proceed with generating the document.
        """
        
        gemini_messages.append({"role": "system", "parts": [system_instruction]})
        
        for msg in conversation_history:
            if msg["role"] == "system":
                continue
            gemini_messages.append({"role": msg["role"], "parts": [msg["content"]]})
        
        # Get response from Gemini — use system_instruction for proper Gemini API usage
        system_instruction = (
            f"You are an expert legal assistant specializing in Indian law and legal documents. "
            f"You are helping a user draft a {session['document_type']} document by gathering relevant "
            f"information through a conversation. Ask focused questions. Be thorough and professional. "
            f"Do not draft the document yet — just gather information. "
            f"If you have collected all necessary information, ask the user if they'd like to generate the document."
        )
        model = genai.GenerativeModel('gemini-2.0-flash', system_instruction=system_instruction)

        # Enhanced handling for patent applications
        if session["document_type"] == "patent-application":
            try:
                # Get patent guidelines
                patent_guidelines = await db.document_template_guidelines.find_one({"document_type": "patent"})
                
                # Analyze conversation to determine what information has been gathered
                # and what sections still need information
                analysis_prompt = f"""
                Analyze the following conversation about a patent application:
                
                {json.dumps([msg for msg in conversation_history if msg["role"] != "system"])}
                
                Determine which patent sections have been adequately addressed and which sections still need more information.
                Return your analysis as JSON with the following structure:
                {{
                    "sections_completed": ["list of sections that have enough information"],
                    "sections_needed": ["list of sections that need more information"],
                    "current_focus": "the section that should be asked about next",
                    "has_basic_info": true/false  # whether we have title, field, and basic problem/solution
                }}
                """
                
                # Use structured content generation to analyze conversation
                analysis_model = genai.GenerativeModel('gemini-2.0-flash')
                analysis_response = analysis_model.generate_content(analysis_prompt)
                
                # Extract JSON from response
                analysis_text = analysis_response.text
                # Clean up JSON if it's wrapped in markdown code blocks
                if "```json" in analysis_text:
                    analysis_text = analysis_text.split("```json")[1].split("```")[0].strip()
                elif "```" in analysis_text:
                    analysis_text = analysis_text.split("```")[1].split("```")[0].strip()
                
                analysis = json.loads(analysis_text)
                
                # Get structured guidance for the next section
                next_section = analysis.get("current_focus", "").lower()
                
                # Default system instruction
                enhanced_instruction = system_instruction
                
                # Initial patent guidance
                if not analysis.get("has_basic_info", False):
                    enhanced_instruction += """
                    Start by gathering basic information:
                    1. A clear title for the invention (under 15 words)
                    2. Technical field of the invention
                    3. Brief description of the problem it solves
                    """
                else:
                    # Use patent guidelines to provide specific guidance for the next section
                    if patent_guidelines and "guidelines" in patent_guidelines:
                        patent_data = patent_guidelines["guidelines"]
                        if "patentWritingGuidelines" in patent_data:
                            guidelines = patent_data["patentWritingGuidelines"]
                            
                            # Match the next_section to available guidelines
                            for section_name, section_data in guidelines.items():
                                if next_section in section_name.lower() or section_name.lower() in next_section:
                                    enhanced_instruction += f"""
                                    Focus on gathering information for the {section_name} section.
                                    Section description: {section_data.get('description', '')}
                                    """
                                    
                                    # Add requirements if available
                                    if "requirements" in section_data:
                                        reqs = section_data["requirements"]
                                        enhanced_instruction += "\nRequirements for this section:\n- " + "\n- ".join(reqs)
                
                # Rebuild model with enhanced instruction for patent guidance
                patent_model = genai.GenerativeModel(
                    'gemini-2.0-flash',
                    system_instruction=enhanced_instruction,
                )
                # Build conversation text without system messages
                conv_text = "\n".join(
                    f"{m['role'].upper()}: {m['content']}"
                    for m in conversation_history if m["role"] != "system"
                )
                response = patent_model.generate_content(conv_text)
            except Exception as e:
                print(f"Error with enhanced patent guidance: {str(e)}")
                conv_text = "\n".join(
                    f"{m['role'].upper()}: {m['content']}"
                    for m in conversation_history if m["role"] != "system"
                )
                response = model.generate_content(conv_text)
        else:
            # Standard response for other document types
            conv_text = "\n".join(
                f"{m['role'].upper()}: {m['content']}"
                for m in conversation_history if m["role"] != "system"
            )
            response = model.generate_content(conv_text)
        
        assistant_message = {
            "role": "assistant",
            "content": response.text
        }
        conversation_history.append(assistant_message)
        
        # Update session with new conversation history
        await db.document_drafting_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "conversation_history": conversation_history,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Return updated conversation
        return {
            "session_id": session_id,
            "message": assistant_message["content"],
            "conversation_history": conversation_history
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@router.post("/{session_id}/generate-draft", response_model=Dict)
async def generate_document_draft(
    session_id: str,
    current_user: User = Depends(get_active_user_with_db)
):
    """Generate document draft from conversation data"""
    try:
        # Get session and verify ownership
        session = await db.document_drafting_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Drafting session not found or you don't have access to it"
            )
            
        if session["status"] != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Session is in {session['status']} status and cannot be modified"
            )
            
        # Calculate credit cost
        credit_cost = CREDIT_COSTS["generate_draft"]
        is_complex = session["document_type"] in COMPLEX_DOCUMENT_TYPES
        
        if is_complex:
            # Verify complex document access
            complex_allowed = await check_feature_access(current_user.id, "complex_documents")
            if not complex_allowed:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your subscription does not include complex document drafting"
                )
            credit_cost += CREDIT_COSTS["complex_document"]
        
        # Check if user has enough credits
        has_credits = await check_credits_available(current_user.id, credit_cost)
        if not has_credits:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="You don't have enough credits to generate this document draft"
            )
            
        # Extract key information from conversation
        conversation_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in session["conversation_history"]])
        
        # First, extract structured document data
        document_data_structure = {
            "fields": {},
            "intent": "What is the user trying to accomplish with this document?",
            "key_entities": ["List of key people, organizations, or items mentioned"],
            "important_dates": {},
            "confidence": "How confident are you about understanding the user's requirements? (high/medium/low)"
        }
        
        document_data = await get_structured_gemini_response(
            prompt=f"""
            Based on the following conversation about a {session['document_type']} document, extract all relevant information that would be needed to draft this document properly:
            
            {conversation_text}
            
            Extract all fields, entities, dates, and other information needed to create a complete legal document.
            """,
            response_structure=document_data_structure,
            system_instruction="You are a legal data extraction expert. Extract structured data from this conversation for document generation."
        )
        
        # Now, generate the document draft
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Get conversation history
        conversation_str = ""
        for msg in session["conversation_history"]:
            if msg["role"] != "system":  # Skip system messages
                conversation_str += f"{msg['role'].upper()}: {msg['content']}\n\n"
        
        # Build different prompts based on document type
        if session["document_type"] == "patent-application":
            # Fetch patent guidelines if available
            try:
                patent_guidelines = await db.document_template_guidelines.find_one({"document_type": "patent"})
                prompt = f"""
                Based on the following conversation with a user seeking to draft a patent application, 
                create a complete and properly formatted patent application document following Indian patent guidelines.
                
                CONVERSATION:
                {conversation_str}
                
                """
                
                if patent_guidelines and "guidelines" in patent_guidelines:
                    # Add patent writing guidelines to the prompt
                    patent_data = patent_guidelines["guidelines"]
                    prompt += f"""
                    PATENT WRITING GUIDELINES:
                    {json.dumps(patent_data, indent=2)}
                    
                    Follow these guidelines strictly and create a comprehensive patent application with all required sections.
                    Include appropriate formatting, headings, and structure for a professional patent document.
                    """
                
                prompt += """
                IMPORTANT: Create a properly formatted patent application document with all sections required by Indian patent law.
                Include appropriate section headings and ensure all content is clear, concise, and follows legal standards.
                
                Remember to add the following disclaimer at the beginning of the document:
                "DISCLAIMER: This is an AI-generated document for informational purposes only and does not constitute legal advice. 
                This document should be reviewed by a qualified patent attorney before filing."
                """
                
            except Exception as e:
                print(f"Error fetching patent guidelines for document generation: {str(e)}")
                # Use a basic prompt if guidelines can't be fetched
                prompt = f"""
                Based on the following conversation with a user seeking to draft a patent application, 
                create a complete and properly formatted patent application document following Indian patent guidelines.
                
                CONVERSATION:
                {conversation_str}
                
                IMPORTANT: Create a properly formatted patent application document with all sections required by Indian patent law.
                Include appropriate section headings and ensure all content is clear, concise, and follows legal standards.
                
                Remember to add the following disclaimer at the beginning of the document:
                "DISCLAIMER: This is an AI-generated document for informational purposes only and does not constitute legal advice. 
                This document should be reviewed by a qualified patent attorney before filing."
                """
        else:
            # Default prompt for other document types
            prompt = f"""
            Based on the following conversation with a user seeking to draft a {session["document_type"]} document, 
            create a complete and properly formatted document following Indian legal standards.
            
            CONVERSATION:
            {conversation_str}
            
            Create a properly formatted {session["document_type"]} document with all necessary sections.
            Include appropriate section headings and ensure all content follows legal standards.
            
            Remember to add the following disclaimer at the beginning of the document:
            "DISCLAIMER: This is an AI-generated document for informational purposes only and does not constitute legal advice. 
            This document should be reviewed by a qualified legal professional before use."
            """
        
        # Generate document content using system_instruction (correct Gemini API usage)
        draft_model = genai.GenerativeModel(
            'gemini-2.0-flash',
            system_instruction="You are an expert legal document drafter specializing in Indian law.",
        )
        draft_response = draft_model.generate_content(
            prompt,
            generation_config={"temperature": 0.2, "max_output_tokens": 8192},
        )
        
        draft_content = draft_response.text
        
        # Update session with document data and draft
        await db.document_drafting_sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "document_data": document_data,
                    "draft_content": draft_content,
                    "status": "completed",
                    "credit_cost": session["credit_cost"] + credit_cost,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Log credit transaction
        await log_credit_transaction(
            user_id=current_user.id,
            amount=-credit_cost,
            transaction_type="ai_document_generation",
            description=f"Generated AI draft for {session['document_type']}"
        )
        
        # Create user document record
        document_name = f"{session['document_type'].capitalize()} - {datetime.utcnow().strftime('%d %b %Y')}"
        
        user_document = {
            "user_id": ObjectId(current_user.id),
            "document_name": document_name,
            "document_type": session["document_type"],
            "content": document_data["fields"],
            "status": "draft",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "full_text": draft_content
        }
        
        document_result = await db.user_documents.insert_one(user_document)
        document_id = document_result.inserted_id
        
        # Return document data
        return {
            "session_id": session_id,
            "document_id": str(document_id),
            "document_data": document_data,
            "draft_content": draft_content,
            "credits_used": credit_cost
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating document draft: {str(e)}"
        )

@router.get("/sessions", response_model=List[DocumentDraftingSession])
async def get_drafting_sessions(current_user: User = Depends(get_active_user_with_db)):
    """Get all drafting sessions for the current user"""
    try:
        sessions = await db.document_drafting_sessions.find({
            "user_id": ObjectId(current_user.id)
        }).sort("updated_at", -1).to_list(None)
        
        return sessions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching drafting sessions: {str(e)}"
        )

@router.get("/sessions/{session_id}", response_model=DocumentDraftingSession)
async def get_drafting_session(
    session_id: str,
    current_user: User = Depends(get_active_user_with_db)
):
    """Get a specific drafting session"""
    try:
        session = await db.document_drafting_sessions.find_one({
            "_id": ObjectId(session_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Drafting session not found or you don't have access to it"
            )
            
        return session
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching drafting session: {str(e)}"
        )

@router.post("/template-guidelines", response_model=Dict)
async def add_or_update_template_guidelines(
    guidelines_data: Dict = Body(...),
    current_user: User = Depends(get_active_user_with_db)
):
    """Add or update guidelines for a document template type"""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can add or update template guidelines"
        )
    
    document_type = guidelines_data.get("document_type")
    guidelines = guidelines_data.get("guidelines")
    
    if not document_type or not guidelines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document type and guidelines are required"
        )
    
    try:
        # Check if document type guidelines already exist
        existing = await db.document_template_guidelines.find_one({"document_type": document_type})
        
        if existing:
            # Update existing
            await db.document_template_guidelines.update_one(
                {"document_type": document_type},
                {
                    "$set": {
                        "guidelines": guidelines,
                        "version": existing.get("version", 1) + 1,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            result = {"status": "updated", "document_type": document_type}
        else:
            # Create new
            await db.document_template_guidelines.insert_one({
                "document_type": document_type,
                "guidelines": guidelines,
                "version": 1,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            result = {"status": "created", "document_type": document_type}
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving template guidelines: {str(e)}"
        )

@router.get("/template-guidelines/{document_type}", response_model=Dict)
async def get_template_guidelines(
    document_type: str,
    current_user: User = Depends(get_active_user_with_db)
):
    """Get guidelines for a specific document template type"""
    try:
        guidelines = await db.document_template_guidelines.find_one({"document_type": document_type})
        
        if not guidelines:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No guidelines found for document type: {document_type}"
            )
        
        # Convert ObjectId to string for JSON serialization
        guidelines["_id"] = str(guidelines["_id"])
        
        return guidelines
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving template guidelines: {str(e)}"
        ) 