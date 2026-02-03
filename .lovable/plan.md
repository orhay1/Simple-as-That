

# Plan: Update Image Settings UI with Clear Billing Indications

## Summary

Update the UI to clearly communicate billing requirements for each image generation model:
- **Nano Banana**: Billing-enabled Gemini API key required, but **FREE** (no charges)
- **Nano Banana Pro**: Billing-enabled Gemini API key required, **PAID** (will be charged)
- **DALL-E 3**: OpenAI API key with credits, **PAID** (will be charged)

Also add automatic fallback to DALL-E when Gemini fails due to quota issues.

---

## Changes Required

### File 1: `src/components/settings/ImageSettingsTab.tsx`

**Update model descriptions to be clear about billing:**

```typescript
const IMAGE_MODELS: ImageModel[] = [
  { 
    value: 'nano-banana-free', 
    label: 'Nano Banana', 
    description: 'Billing-enabled key required • 500 free/day • No charges',
    tier: 'free',
  },
  { 
    value: 'nano-banana-pro', 
    label: 'Nano Banana Pro', 
    description: 'Billing-enabled key required • Highest quality • Paid usage',
    tier: 'paid',
  },
  { 
    value: 'openai/dall-e-3', 
    label: 'DALL-E 3', 
    description: 'OpenAI API key required • Paid usage',
    tier: 'paid',
  },
];
```

**Update badge labels to be clearer:**
- Free tier: Badge shows "Free*" (with asterisk indicating billing required)
- Paid tier: Badge shows "Paid"

---

### File 2: `src/lib/i18n/translations.ts`

**English updates (lines 558-567):**

```typescript
settingsImages: {
  title: 'Image Generation Settings',
  description: 'Choose the AI model for generating images for your LinkedIn posts',
  modelLabel: 'Image Generation Model',
  modelNotes: 'Model Notes',
  geminiNote: 'Requires billing-enabled Gemini API key. 500 free images/day (no charges)',
  dalleNote: 'Requires OpenAI API key. Paid per image generated',
  flashNote: 'Requires billing-enabled Gemini API key. Paid per image (highest quality)',
  accessTip: 'All models require a billing-enabled API key. Nano Banana offers 500 free images/day without charges.',
},
```

**Hebrew updates (lines 872-881):**

```typescript
settingsImages: {
  title: 'הגדרות יצירת תמונות',
  description: 'בחר את מודל ה-AI ליצירת תמונות לפוסטים שלך בלינקדאין',
  modelLabel: 'מודל יצירת תמונות',
  modelNotes: 'הערות על המודלים',
  geminiNote: 'דורש מפתח Gemini API עם חיוב מופעל. 500 תמונות חינם ליום (ללא חיוב)',
  dalleNote: 'דורש מפתח OpenAI API. תשלום לפי תמונה',
  flashNote: 'דורש מפתח Gemini API עם חיוב מופעל. תשלום לפי תמונה (איכות גבוהה)',
  accessTip: 'כל המודלים דורשים מפתח API עם חיוב מופעל. Nano Banana מציע 500 תמונות חינם ליום ללא חיוב.',
},
```

---

### File 3: `supabase/functions/generate-image/index.ts`

**Add automatic fallback to DALL-E when Gemini fails:**

When Nano Banana fails with a quota/billing error, automatically try DALL-E if the user has an OpenAI key configured:

```typescript
// In the main handler, wrap Nano Banana calls with fallback logic:
try {
  base64Data = await generateWithNanoBanana(prompt, userKeys.gemini);
  usedModel = 'nano-banana-free';
} catch (nanoBananaError: any) {
  // If quota/billing issue and OpenAI available, fallback to DALL-E
  if (userKeys.openai && (
    nanoBananaError.message.includes('billing-enabled') ||
    nanoBananaError.message.includes('Rate limit') ||
    nanoBananaError.message.includes('quota')
  )) {
    console.log('Gemini failed, falling back to DALL-E');
    base64Data = await generateWithOpenAI(prompt, userKeys.openai);
    usedModel = 'dall-e-3';
  } else {
    throw nanoBananaError;
  }
}
```

**Update error messages to be clearer:**
- 429 errors: "Image generation requires a billing-enabled Gemini API key. Add a payment method at ai.google.dev (you won't be charged for the first 500 images/day)."

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/settings/ImageSettingsTab.tsx` | Update model descriptions to clarify billing requirements |
| `src/lib/i18n/translations.ts` | Update EN/HE model notes with billing clarification |
| `supabase/functions/generate-image/index.ts` | Add DALL-E fallback when Gemini fails, improve error messages |

---

## Visual Result

After this change, users will see:

| Model | Badge | Description |
|-------|-------|-------------|
| Nano Banana | Free* | Billing-enabled key required • 500 free/day • No charges |
| Nano Banana Pro | Paid | Billing-enabled key required • Highest quality • Paid usage |
| DALL-E 3 | Paid | OpenAI API key required • Paid usage |

The notes section will explain:
- **Nano Banana** — Requires billing-enabled Gemini API key. 500 free images/day (no charges)
- **Nano Banana Pro** — Requires billing-enabled Gemini API key. Paid per image (highest quality)
- **DALL-E 3** — Requires OpenAI API key. Paid per image generated

---

## Expected Behavior

1. User selects Nano Banana (Free) → Uses Gemini with billing-enabled key → No charges for first 500/day
2. If Gemini fails due to quota → Automatically falls back to DALL-E if OpenAI key is configured
3. If no fallback available → Shows clear error about needing billing-enabled key
4. User selects Nano Banana Pro → Uses premium Gemini model → Charges apply
5. User selects DALL-E 3 → Uses OpenAI → Charges apply

