
# Plan: Fix Gemini Image Generation to Use Free Tier Model

## Problem

The `generate-image` edge function fails with a 404 error because `gemini-2.0-flash-exp-image-generation` is not a valid/available model for the Gemini API free tier.

Error from logs:
```
models/gemini-2.0-flash-exp-image-generation is not found for API version v1beta
```

## Root Cause

The model name used doesn't exist in the current Google AI Studio API. Based on official documentation, the correct free tier models for image generation are:
- `gemini-2.5-flash-preview-image-generation` (faster, free tier)
- `gemini-2.0-flash-exp-image-generation` is deprecated/unavailable

## Solution

Update the `generate-image` edge function to use the correct model name that works with user-provided Gemini API keys on the free tier.

### Changes Required

**File: `supabase/functions/generate-image/index.ts`**

| Location | Current (broken) | Fixed |
|----------|------------------|-------|
| Line 111 (URL) | `gemini-2.0-flash-exp-image-generation` | `gemini-2.5-flash-preview-image-generation` |
| Line 316 (usedModel) | `gemini-2.0-flash-exp-image-generation` | `gemini-2.5-flash-preview-image-generation` |
| Line 324 (usedModel) | `gemini-2.0-flash-exp-image-generation` | `gemini-2.5-flash-preview-image-generation` |

**File: `src/components/settings/ImageSettingsTab.tsx`**

Update the model options to reflect the actual API model names used:

| Current | Fixed |
|---------|-------|
| `google/gemini-3-pro-image-preview` | Keep (for future support) |
| `google/gemini-2.5-flash-image` | `google/gemini-2.5-flash-preview-image-generation` |

### Technical Details

The `generateWithGemini` function will be updated:

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent?key=${apiKey}`,
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

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-image/index.ts` | Update model name to `gemini-2.5-flash-preview-image-generation` in 3 locations |
| `src/components/settings/ImageSettingsTab.tsx` | Sync model values with API model names |

---

## Expected Result

After this fix:
- Image generation will work using user's Gemini API key on the free tier
- No Lovable Gateway usage for image generation
- Users will see generated images in their drafts
- The Settings tab will accurately reflect available models
