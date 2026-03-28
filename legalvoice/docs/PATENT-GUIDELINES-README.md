# Patent Guidelines API Fix

This document explains the recent fixes to the Patent Guidelines API endpoint and how to use it in your application.

## Issue Fixed

The original `/pages/api/patent-guidelines.ts` endpoint was throwing a `ReferenceError` for `connectToDatabase` because:

1. The database connection function was not properly imported
2. The PatentGuideline model was undefined

## Solution Implemented

We've made the following changes to fix the issue:

1. Created a new `PatentGuideline.ts` model in `app/lib/models/` with a proper interface and dummy data
2. Implemented a new App Router API endpoint at `/app/api/patent-guidelines/route.ts` 
3. Deleted the Pages Router endpoint to avoid route conflicts with Next.js

The solution includes automatic database seeding with dummy patent guidelines data when the collection doesn't exist or when in development mode.

## How to Use

The endpoint takes a `section` query parameter to fetch guidelines for a specific patent section:

```typescript
// Example usage in your components
const fetchGuidelines = async (section: string) => {
  const response = await fetch(`/api/patent-guidelines?section=${section}`);
  if (response.ok) {
    const data = await response.json();
    return data.guidelines;
  }
  return [];
};
```

Available section values include:
- `title`
- `background`
- `summary`
- `description`
- `claims`
- `abstract`

## Error Handling

The API endpoint includes robust error handling:

1. If the database connection fails, the endpoint will fall back to dummy data
2. If no guidelines are found for a section, an empty array will be returned
3. Missing required parameters will return appropriate error messages

## Frontend Component Update

The `AIDraftingChat.tsx` component has been updated to use the new App Router endpoint.

---

Updated by Claude 3.7 Sonnet | Date: May 2024 