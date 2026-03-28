# Patent Drafting Guide

## Overview

The LegalVoice.ai platform includes a specialized patent application drafting feature that helps users create well-structured patent applications. This document describes the features, implementation details, and guidelines for using the patent drafting tools.

## Features

### Section-by-Section Drafting

The patent drafting interface guides users through the standard sections of a patent application:

1. **Title** - Brief title for the invention
2. **Field of Invention** - Technical field to which the invention belongs
3. **Background** - Existing technologies and their limitations
4. **Objects** - Technical problems and solutions
5. **Summary** - Concise overview of the invention
6. **Drawings Description** - Explanation of figures
7. **Detailed Description** - Complete explanation of the invention
8. **Claims** - Legal scope of protection sought
9. **Abstract** - Brief summary of the invention

Each section includes:
- Progress tracking
- Guidelines and tips
- Quick prompts to help users get started

### Interactive Guidance

The system provides several types of guidance:

1. **Progress Indicators** - Visual tracking of completed and current sections
2. **Section Tips** - Best practices for each section based on importance
3. **Quick Prompts** - Suggested questions or statements to help users generate content
4. **Reference Guidelines** - Detailed guidelines for each section from the database

### Implementation Details

#### Components

- **AIDraftingChat** - The main component for the drafting interface
- **Patent Section Utils** - Utility functions for managing patent sections and progress

#### Database

Patent guidelines are stored in MongoDB with the following structure:

```javascript
{
  section: String,    // Section identifier (e.g., "title", "claims")
  title: String,      // Guideline title
  content: String,    // Detailed guidance content
  order: Number       // Display order within section
}
```

#### Initialization

Guidelines can be initialized using the database script:

```
python backend/init_db.py
```

## Using the Patent Drafting Interface

### Starting a Patent Application

1. Navigate to the document drafting page
2. Select "Patent Application" as the document type
3. Begin with a brief description of your invention

### Working Through Sections

The interface will guide you through each section:

1. Follow the section progress bar at the top
2. Use the quick prompts to get started with each section
3. Review the guidelines in the sidebar for detailed advice
4. Complete sections in order, or jump between them as needed

### Section Tips

- **Title**: Keep it concise (under 15 words) and focused on the technical subject
- **Field**: Clearly identify the technical area without marketing language
- **Background**: Describe existing technology objectively; identify problems
- **Objects**: State technical problems your invention solves
- **Summary**: Provide a broad overview without limiting scope
- **Drawings**: Describe figures concisely with consistent numbering
- **Detailed Description**: Explain how to make and use the invention
- **Claims**: Start with broad independent claims, followed by dependent claims
- **Abstract**: Keep under 150 words, focusing on the technical solution

## Technical Implementation

The patent drafting system uses:

- Next.js framework for the frontend
- MongoDB for storing guidelines and user data
- Firebase for authentication
- React state management for tracking progress
- Google's Gemini 2.0 Flash AI model for intelligent assistance

Key files:
- `app/components/AIDraftingChat.tsx` - Main drafting interface
- `utils/patent-sections.ts` - Patent section utilities
- `app/lib/utils/geminiClient.ts` - Gemini API integration
- `pages/api/patent-guidelines.ts` - API endpoint for guidelines
- `app/api/ai-drafting/[session_id]/message/route.ts` - Message handling
- `app/api/ai-drafting/[session_id]/generate-draft/route.ts` - Document generation
- `backend/init_db.py` - Database initialization script

### Gemini Integration

The system uses the `gemini-2.0-flash` model with these optimizations:

1. **Message Compatibility**: System messages are converted to user messages with an instruction prefix since Gemini doesn't support the system role
2. **Context Window**: Limited to 3 recent messages for more focused responses
3. **Temperature**: Set to 0.5 for more factual, consistent responses
4. **Safety Settings**: Medium threshold to prevent harmful content
5. **Section Analysis**: Pattern matching and keyword detection to track current section

### Response Generation

When a user sends a message, the system:

1. Identifies the current patent section being discussed
2. Retrieves relevant guidelines for that section
3. Creates instruction messages with section-specific guidance
4. Passes recent conversation history with instructions to Gemini
5. Analyzes the response for section completion indicators
6. Updates progress tracking accordingly

## Future Enhancements

Planned improvements include:

1. AI-assisted section analysis
2. Patent claim formatting tools
3. Drawing upload and management
4. Prior art search integration
5. Automated patent quality assessment 