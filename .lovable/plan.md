

# Plan: Add Nano Banana Models (Free & Paid) for Image Generation

## Summary

Replace the current Imagen model with the **Nano Banana** model family from Google:
- **Nano Banana (Free)**: `gemini-2.5-flash-image` — 500 free images/day
- **Nano Banana Pro (Paid)**: `gemini-3-pro-image-preview` — Requires paid Gemini API
- **DALL-E 3 (Paid)**: OpenAI model — Requires OpenAI API key

Users will see clear **Free** and **Paid** badges when selecting models.

---

## Changes Required

### File 1: `supabase/functions/generate-image/index.ts`

Replace the Imagen-based generation with two new Gemini functions using the `generateContent` API:

| Function | Model | Use Case |
|----------|-------|----------|
| `generateWithNanoBanana()` | `gemini-2.5-flash-image` | Free tier (500/day) |
| `generateWithNanoBananaPro()` | `gemini-3-pro-image-preview` | Paid tier (higher quality) |

**API Pattern** (same for both models):
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ 
        parts: [{ text: `Professional LinkedIn post image: ${prompt}` }] 
      }],
      generationConfig: {
        imageConfig: { aspectRatio: "1:1" }
      }
    }),
  }
);
```

**Model routing logic**:
- `nano-banana-free` → `generateWithNanoBanana()` using `gemini-2.5-flash-image`
- `nano-banana-pro` → `generateWithNanoBananaPro()` using `gemini-3-pro-image-preview`
- `openai/dall-e-3` → `generateWithOpenAI()` (existing)

---

### File 2: `src/components/settings/ImageSettingsTab.tsx`

Update model options with free/paid tiers and visual badges:

```typescript
const IMAGE_MODELS = [
  { 
    value: 'nano-banana-free', 
    label: 'Nano Banana', 
    description: '500 free images/day • Fast generation',
    tier: 'free',
  },
  { 
    value: 'nano-banana-pro', 
    label: 'Nano Banana Pro', 
    description: 'Highest quality • Requires paid Gemini API',
    tier: 'paid',
  },
  { 
    value: 'openai/dall-e-3', 
    label: 'DALL-E 3', 
    description: 'Requires OpenAI API key with credits',
    tier: 'paid',
  },
];
```

Add visual badges:
- **Free** badge (green) for `nano-banana-free`
- **Paid** badge (amber) for `nano-banana-pro` and `dall-e-3`

---

### File 3: `src/lib/i18n/translations.ts`

Update translation strings for both English and Hebrew:

**English updates**:
```typescript
settingsImages: {
  // ...existing
  geminiNote: 'Nano Banana offers 500 free images per day',
  dalleNote: 'Requires OpenAI API key with credits',
  flashNote: 'Nano Banana Pro requires a paid Gemini API for highest quality',
  paidNote: 'Paid tier models require billing-enabled API keys',
}
```

**Hebrew updates** (matching translations)

---

## Technical Details

### Response Parsing

The Gemini `generateContent` API returns image data in this format:
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inlineData": {
          "mimeType": "image/png",
          "data": "base64-encoded-image-data"
        }
      }]
    }
  }]
}
```

Extract with:
```typescript
const base64Data = data.candidates?.[0]?.content?.parts
  ?.find(p => p.inlineData)?.inlineData?.data;
```

### Error Handling

Add specific error messages:
- 403: "This model requires a paid Gemini API key. Try switching to Nano Banana (free tier)."
- 429: "Rate limit exceeded. Free tier allows 500 images/day."
- 404: "Model not available. Please check your API key has image generation enabled."

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-image/index.ts` | Replace Imagen with Nano Banana models, add `generateWithNanoBanana()` and `generateWithNanoBananaPro()` functions, update routing logic |
| `src/components/settings/ImageSettingsTab.tsx` | Update model options with free/paid tiers and visual badges |
| `src/lib/i18n/translations.ts` | Update model notes in EN and HE, add `paidNote` translation |

---

## Expected Result

After this fix:
- Free tier Gemini API keys work with **Nano Banana** (500 free images/day)
- Paid Gemini API keys can use **Nano Banana Pro** for higher quality
- Users see clear **Free** / **Paid** badges when selecting models
- Model defaults to **Nano Banana (Free)** for new users
- No Lovable Gateway usage — all generation uses user's own API keys

