# Patent Application Agent

This document explains the patent application agent feature that guides users through creating patent applications section by section.

## Overview

The patent application agent uses Google's Gemini API (specifically the gemini-2.0-flash model) to create a sophisticated assistant that helps users write patent applications. The agent:

1. Guides users through each section of a patent application
2. Provides section-specific advice and requirements
3. Tracks progress across all sections
4. Generates a structured patent draft based on the conversation

## Implementation Details

### Core Components

1. **Gemini 2.0 Flash Integration**: Uses Google's gemini-2.0-flash model for high-quality, contextual responses with faster performance
2. **Patent Section Tracking**: Analyzes conversation to determine which section is being discussed
3. **Section-Specific Prompting**: Provides tailored guidance for each section
4. **Progress Tracking**: Monitors which sections are completed and updates the UI

### API Routes

Three main API routes handle the patent agent workflow:

1. **`/api/ai-drafting/start-session`**: Creates a new patent drafting session with appropriate initial prompts
2. **`/api/ai-drafting/[session_id]/message`**: Processes user messages and generates appropriate responses
3. **`/api/ai-drafting/[session_id]/generate-draft`**: Creates a structured patent document based on the conversation

### Patent Sections

The agent works with these standard patent application sections:

- Title
- Field of Invention
- Background
- Objects of Invention
- Summary
- Description of Drawings
- Detailed Description
- Claims
- Abstract

## How It Works

1. **Session Initialization**:
   - When a user starts a patent drafting session, the system initializes with guidance for the title section
   - Sets up tracking metadata for section progress

2. **Message Processing**:
   - When a user sends a message, the patent agent analyzes the conversation
   - Determines the current section being discussed
   - Updates progress tracking metadata
   - Sends the conversation to Gemini API with section-specific context
   - Receives and delivers the response

3. **Document Generation**:
   - When the user requests a document, the system:
   - Extracts relevant conversation parts for each section
   - Organizes them into a structured patent application
   - Marks incomplete sections accordingly

## Environment Setup

The patent agent requires the following environment variables:

```
# Google Gemini API
GEMINI_API_KEY=your_api_key_here
```

## Model Configuration

The implementation uses the gemini-2.0-flash model with these configurations:
- Temperature: 0.5-0.7 (balanced between creativity and determinism)
- Top-P: 0.95 (considers tokens with top 95% probability mass)
- Top-K: 40 (considers 40 highest probability tokens)
- Max Output Tokens: 8192 (allows for long, detailed responses)
- Safety Settings: Medium blocking threshold for harmful content

### Gemini Model Compatibility Notes

Since gemini-2.0-flash doesn't support the "system" role in messages, our implementation:

1. Converts system messages to user messages with an instruction prefix
2. Uses a special format for instructions: `[Instructions for AI assistant: ...]`
3. Handles the conversion transparently in the `callGeminiApi` function
4. Places instructions at the beginning of the conversation context

This approach maintains the benefits of system prompts while working within Gemini's limitations.

## Frontend Integration

The frontend uses the metadata returned from the API to:

1. Display a progress bar showing completed sections
2. Highlight the current section being worked on
3. Offer relevant quick prompts for the current section

## Fallbacks

The system includes fallbacks if the Gemini API is unavailable:

1. For new sessions: Defaults to basic section guidance
2. For messages: Provides a generic response that encourages continuation
3. For document generation: Creates a template with placeholders

## Extending the Agent

To extend the agent to support more document types:

1. Create a new section definition in `geminiClient.ts`
2. Add document-specific logic in the message route
3. Implement a custom document generator in the generate-draft route
4. Update the start-session route to initialize the new document type

---

Updated by Claude 3.7 Sonnet | Date: May 2024 