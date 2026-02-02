
# Plan: Fix Invalid `imageSafetySettings` Field in Gemini API Request

## Problem

The `generate-image` edge function is failing with a **400 Bad Request** error because it includes an invalid field `imageSafetySettings` in the `generationConfig`:

```
"Invalid JSON payload received. Unknown name \"imageSafetySettings\" at 'generation_config': Cannot find field."
```

## Root Cause

Lines 120-123 and 173-176 in `supabase/functions/generate-image/index.ts` include:

```typescript
generationConfig: {
  responseModalities: ["image", "text"],
  imageSafetySettings: "block_low_and_above",  // ← INVALID FIELD
},
```

The `imageSafetySettings` field does not exist in the Gemini API's `generationConfig`. Safety settings must be passed as a separate top-level field called `safetySettings` (not inside `generationConfig`).

## Solution

Remove the invalid `imageSafetySettings` field from both `generateWithNanoBanana()` and `generateWithNanoBananaPro()` functions. Keep only `responseModalities: ["image", "text"]` which is correct for image generation.

---

## Changes Required

### File: `supabase/functions/generate-image/index.ts`

**Change 1: Lines 120-123** - Remove `imageSafetySettings` from `generateWithNanoBanana()`:

| Current (broken) | Fixed |
|------------------|-------|
| `generationConfig: { responseModalities: ["image", "text"], imageSafetySettings: "block_low_and_above" }` | `generationConfig: { responseModalities: ["image", "text"] }` |

**Change 2: Lines 173-176** - Remove `imageSafetySettings` from `generateWithNanoBananaPro()`:

| Current (broken) | Fixed |
|------------------|-------|
| `generationConfig: { responseModalities: ["image", "text"], imageSafetySettings: "block_low_and_above" }` | `generationConfig: { responseModalities: ["image", "text"] }` |

---

## Technical Details

The corrected request body will be:

```typescript
body: JSON.stringify({
  contents: [{ 
    parts: [{ text: `Professional LinkedIn post image: ${prompt}. Clean, modern, business-appropriate style.` }] 
  }],
  generationConfig: {
    responseModalities: ["image", "text"],
  },
}),
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-image/index.ts` | Remove `imageSafetySettings` field from lines 122 and 175 |

---

## Expected Result

After this fix:
- The Gemini API will accept the request without a 400 error
- Free tier Gemini API keys will work with Nano Banana model
- Paid tier will work with Nano Banana Pro model
- Image generation will succeed and save to storage
