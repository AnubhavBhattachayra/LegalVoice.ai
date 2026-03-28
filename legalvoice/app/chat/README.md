# LegalVoice.AI Chatbot Technical Documentation

This document provides a comprehensive technical overview of the LegalVoice.AI chatbot system, detailing its architecture, RAG implementation, and the integration with Google's updated Gemini API.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Implementation](#backend-implementation)
3. [New Gemini API Integration](#new-gemini-api-integration)
4. [RAG System](#rag-system)
5. [API Endpoints](#api-endpoints)
6. [Data Flow](#data-flow)

## System Architecture

The LegalVoice.AI chatbot is built on a modern stack with clear separation between frontend and backend:

- **Frontend**: React/Next.js application that provides the chat interface
- **Backend**: FastAPI-based Python service that handles AI processing, document management, and database operations
- **AI Model**: Google's Gemini 2.0 Flash for natural language understanding and generation
- **Storage**: MongoDB for chat sessions, user data, and document metadata
- **File Storage**: Cloud storage for document uploads

### Component Architecture:

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│                 │     │                  │     │               │
│  React Frontend │────▶│ FastAPI Backend  │────▶│  Gemini API   │
│                 │◀────│                  │◀────│               │
└─────────────────┘     └──────────────────┘     └───────────────┘
                              │      ▲
                              │      │
                              ▼      │
                         ┌────────────────┐
                         │                │
                         │    MongoDB     │
                         │                │
                         └────────────────┘
```

## Backend Implementation

The backend implementation (`backend/routes/chat_routes.py`) handles all AI interactions using the latest Gemini API client. The code has been updated from the previous implementation that used `google.generativeai` to now use the newer `google.genai` client, which provides improved capabilities for chat, document analysis, and content generation.

## New Gemini API Integration

### Client Initialization

The updated code initializes the Gemini client with an API key:

```python
from google import genai
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
```

### Chat Session Management

The new Gemini API provides improved chat session handling with persistent conversations:

```python
# Create new chat session with message history
chat = client.chats.create(
    model="gemini-2.0-flash",
    history=[
        types.Content(
            role="user", 
            parts=[types.Part(text=msg.content)]
        ) for msg in chat_data.messages if msg.sender == "user"
    ]
)

# Get an existing chat session by ID
chat = client.chats.get(session_id)

# Send a message to an existing chat session
response = chat.send_message(message=user_message)
```

### Message Handling

Messages are now structured using the `types.Content` and `types.Part` classes:

```python
# Convert messages to Gemini format
history = []
for msg in chat_data.messages:
    role = "user" if msg.sender == "user" else "model"
    history.append(types.Content(
        role=role,
        parts=[types.Part(text=msg.content)]
    ))
```

### Document Analysis

The new API includes improved document handling with file uploads:

```python
# Upload document with proper MIME type
uploaded_file = client.files.upload(
    file=io.BytesIO(file_content),
    config=dict(mime_type=file.content_type)
)

# Generate analysis with document context
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[
        "Analyze this legal document and provide:",
        "1. Document type",
        "2. Key points",
        "3. Potential issues",
        "4. Recommendations",
        uploaded_file
    ]
)
```

### Content Generation

The API now uses a more streamlined approach for content generation:

```python
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=prompt
)
```

## RAG System

The LegalVoice.AI chatbot employs a sophisticated Retrieval-Augmented Generation (RAG) system to enhance responses with relevant document context.

### RAG Implementation:

1. **Document Indexing**:
   - Documents are processed and chunked into manageable segments
   - Each chunk is indexed with metadata for efficient retrieval
   - Index is stored in MongoDB for quick access

2. **Context Retrieval**:
   - User query is analyzed for key terms
   - Relevant document chunks are retrieved based on semantic similarity
   - Retrieved chunks are ranked by relevance

3. **Context Augmentation**:
   - Retrieved chunks are formatted into a structured prompt
   - Context is combined with conversation history
   - System instructions are added for legal domain expertise

4. **Response Generation**:
   - Gemini processes the augmented prompt
   - Response is generated with document references
   - Citations are verified and formatted

### Document Context Implementation

```python
# Example: Adding document context to a chat message
def add_document_context(user_query, document_chunks):
    document_context = "\n\n".join([chunk["text"] for chunk in document_chunks])
    
    # Create content with document context
    contents = [
        "Based on the following document sections:",
        document_context,
        "Answer this question:",
        user_query
    ]
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents
    )
    return response.text
```

## API Endpoints

### Chat Endpoints:

1. **Send Message** (`POST /api/chat/message`):
   ```python
   @router.post("/message", response_model=Dict)
   async def send_message(
       chat_data: ChatRequest = Body(...),
       current_user: Optional[User] = Depends(get_current_active_user)
   ):
       # Convert messages to Gemini format
       history = []
       for msg in chat_data.messages:
           role = "user" if msg.sender == "user" else "model"
           history.append(types.Content(
               role=role,
               parts=[types.Part(text=msg.content)]
           ))

       # Create or get existing chat session
       if chat_data.session_id:
           chat = client.chats.get(chat_data.session_id)
       else:
           chat = client.chats.create(
               model="gemini-2.0-flash",
               history=history
           )

       # Get the last user message
       last_message = next((msg.content for msg in reversed(chat_data.messages) 
                            if msg.sender == "user"), None)
       
       # Send message and get response
       response = chat.send_message(message=last_message)
       
       # Save to database and return
       # ...
   ```

2. **Analyze Document** (`POST /api/chat/analyze-document`):
   ```python
   @router.post("/analyze-document", response_model=Dict)
   async def analyze_document(
       file: UploadFile = File(...),
       current_user: User = Depends(get_current_active_user)
   ):
       # Read file content
       file_content = await file.read()
       
       # Upload file to Gemini
       uploaded_file = client.files.upload(
           file=io.BytesIO(file_content),
           config=dict(mime_type=file.content_type)
       )
       
       # Generate analysis
       response = client.models.generate_content(
           model="gemini-2.0-flash",
           contents=["Analyze this legal document:", uploaded_file]
       )
       
       # Save to database and return
       # ...
   ```

3. **Suggest Document** (`POST /api/chat/suggest-document`):
   ```python
   @router.post("/suggest-document", response_model=Dict)
   async def suggest_document(
       chat_data: ChatRequest = Body(...),
       current_user: Optional[User] = None
   ):
       # Construct prompt
       prompt = get_document_type_prompt(chat_data.messages, chat_data.language)
       
       # Generate suggestion
       response = client.models.generate_content(
           model="gemini-2.0-flash",
           contents=prompt
       )
       
       # Process response and return
       # ...
   ```

4. **Translate** (`POST /api/chat/translate`):
   ```python
   @router.post("/translate", response_model=Dict)
   async def translate_text(
       text_data: Dict = Body(...),
   ):
       # Construct prompt
       prompt = f"""
       Translate the following text from English to {text_data.get('target_language', 'Hindi')}:
       
       "{text_data.get('text', '')}"
       
       Provide only the translated text, with no additional information or explanations.
       """
       
       # Generate translation
       response = client.models.generate_content(
           model="gemini-2.0-flash",
           contents=prompt
       )
       
       # Return translation
       # ...
   ```

## Data Flow

### Message Processing Flow:

1. **User sends message**: Frontend submits message to backend API
2. **Backend processes message**:
   - Converts message history to Gemini format using `types.Content` and `types.Part`
   - Creates or retrieves chat session using `client.chats.create()` or `client.chats.get()`
   - Sends message to Gemini using `chat.send_message()`
3. **Gemini generates response**: The model processes the message with context
4. **Backend saves interaction**: The conversation is stored in MongoDB
5. **Response returned to user**: Frontend displays the response

### Document Processing Flow:

1. **User uploads document**: Document is sent to backend
2. **Backend processes document**:
   - Document is read and converted to bytes
   - File is uploaded to Gemini using `client.files.upload()`
   - Analysis prompt is sent with document using `client.models.generate_content()`
3. **Gemini analyzes document**: The model processes the document and generates analysis
4. **Analysis stored in database**: Results are saved for future reference
5. **Results returned to user**: Frontend displays the analysis

## Environment Setup

### Required Environment Variables:

```env
# Backend
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URI=your_mongodb_uri
SECRET_KEY=your_jwt_secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development Guidelines

1. **API Key Management**:
   - Store API keys in environment variables
   - Never commit keys to version control
   - Implement key rotation policies

2. **Error Handling**:
   - Implement proper error handling for API failures
   - Handle rate limiting and quota errors
   - Provide meaningful error messages to users

3. **Rate Limiting**:
   - Monitor API usage and costs
   - Implement appropriate rate limiting
   - Set up alerts for excessive usage

4. **Testing**:
   - Test chat functionality with various inputs
   - Verify document analysis with different file types
   - Test error cases and recovery mechanisms 