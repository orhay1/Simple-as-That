
# Plan: Fix Gemini Image Generation Model Error

## Problem

The `generate-image` edge function is failing with a 404 error because it's using `gemini-2.0-flash-exp`, which is not a valid image generation model:

```
models/gemini-2.0-flash-exp is not found for API version v1beta, 
or is not supported for generateContent
```

## Root Cause

The function was written with an outdated Gemini model name. The correct models for image generation with user API keys are:
- `gemini-2.0-flash-exp-image-generation` (for image generation via Google AI Studio API)
- Or using the newer `imagen-3.0-generate-002` model

However, based on Google's current API, the correct approach for image generation using a user's Gemini API key is to use the `gemini-2.0-flash-exp-image-generation` model with the `generateContent` endpoint.

## Solution

Update `supabase/functions/generate-image/index.ts` to use the correct Gemini model and API format:

### Changes to `generateWithGemini` function:

**Current (broken):**
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
  // ...
);
```

**Fixed:**
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { 
          parts: [{ text: `Generate an image: Professional LinkedIn post image: ${prompt}. Clean, modern, business-appropriate style.` }] 
        }
      ],
      generationConfig: {
        responseModalities: ['image', 'text'],
      },
    }),
  }
);
```

### Model name updates throughout the function:

| Location | Current | Fixed |
|----------|---------|-------|
| Line 111 | `gemini-2.0-flash-exp` | `gemini-2.0-flash-exp-image-generation` |
| Line 313 | `usedModel = 'gemini-2.0-flash-exp'` | `usedModel = 'gemini-2.0-flash-exp-image-generation'` |
| Line 321 | `usedModel = 'gemini-2.0-flash-exp'` | `usedModel = 'gemini-2.0-flash-exp-image-generation'` |

### Additional error handling:

Add specific error message for model not found:
```typescript
if (response.status === 404) {
  throw new Error('Gemini image generation model not available. Please ensure your API key has access to image generation.');
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-image/index.ts` | Update model name to `gemini-2.0-flash-exp-image-generation` in 3 locations, add 404 error handling |

---

## Expected Result

After this fix:
- Image generation with Gemini API key will work correctly
- Users will see generated images in their drafts
- Proper error messages for API access issues
