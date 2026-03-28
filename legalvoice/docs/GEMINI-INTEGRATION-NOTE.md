# Gemini Integration Technical Note

## Overview

This document details the changes made to the LegalVoice.ai application to properly integrate Google's Gemini AI model, with specific focus on handling system messages and optimizing response generation.

## Key Changes

### 1. System Message Handling

The Gemini 2.0 Flash model does not support the `system` role in messages, which was causing API errors. We implemented the following solution:

```typescript
// In callGeminiApi function
const formattedMessages = messages.map(msg => {
  if (msg.role === 'system') {
    // Convert system messages to user messages with a special prefix
    return {
      role: 'user',
      parts: [{ text: `[Instructions for AI assistant: ${msg.content}]` }]
    };
  } else {
    // Keep other roles as they are, mapping 'assistant' to 'model' if needed
    return {
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    };
  }
});
```

### 2. Patent Response Generation Optimization

The `generatePatentResponse` function was updated to:

- Filter to the last 3 relevant messages for context
- Create explicit instruction messages as user messages with section guidance
- Lower temperature to 0.5 for more factual responses
- Add comprehensive error handling with fallback messages

```typescript
// Example instruction format
const instructionMessage = {
  role: 'user', 
  content: `[Instructions for AI assistant: You are helping with the ${currentSection.title} section of a patent application. 
  ${currentSection.description}
  Requirements: ${currentSection.requirements}
  Notes: ${currentSection.notes}]`
};
```

### 3. Safety Settings Implementation

Added explicit safety settings to block harmful content:

```typescript
const safetySettings = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE"
  },
  // Additional safety categories...
];
```

## Implementation Files

The changes were made in the following files:

1. `app/lib/utils/geminiClient.ts` - Core API integration and system message handling
2. `app/api/ai-drafting/[session_id]/message/route.ts` - Message processing logic

## Testing Notes

When testing these changes, please verify:

1. System messages are properly converted to user messages with the instructional prefix
2. Response generation works for all patent sections
3. Error handling gracefully manages API failures
4. The progress tracking still updates correctly based on section detection

## Future Considerations

1. Consider implementing streaming responses for better UX
2. Explore fine-tuning options for the Gemini model to improve patent-specific responses
3. Add caching mechanisms to reduce API costs for similar queries

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs/gemini_api)
- [Google Cloud Safety Settings](https://cloud.google.com/natural-language/docs/reference/rest/v1/SafetySettings)

---

Last Updated: May 2024 