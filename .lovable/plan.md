

# Plan: Fix API Key Save Race Condition (400 Bad Request Error)

## Problem Diagnosis

The 400 Bad Request error occurs because **API keys are not being saved correctly** due to a React stale closure / race condition.

### Root Cause

In `src/components/settings/APIKeysTab.tsx`:

1. **Line 95-101** (`KeyInput.handleSave`): Calls `onChange(localValue)` to update parent state, then immediately calls `onSave()`
2. **Line 304**: The `onSave` callback is defined as `() => handleSave(config.key, keyValues[config.key] || '')`
3. **The bug**: `onChange` triggers a state update which is asynchronous, but `onSave()` executes immediately with the OLD `keyValues` (empty string)

Result: The database stores `""` (empty strings) instead of actual API keys.

Database evidence:
```
user_api_key_gemini: "\"\""  // Empty string wrapped in JSON
user_api_key_openai: "\"\""
user_api_key_perplexity: "\"\""
user_api_key_firecrawl: "\"\""
```

Edge function logs confirm:
```
User keys: perplexity=false, gemini=false, firecrawl=false
```

---

## Solution

Modify the save flow to pass the **actual key value directly** from the child component to the parent's save handler, bypassing the stale state issue.

### Changes to `src/components/settings/APIKeysTab.tsx`

**1. Update `KeyInput` interface and props** (around line 72-83)

Change `onSave` to accept the value directly:
```typescript
interface KeyInputProps {
  // ... existing props
  onSave: (value: string) => void;  // Now accepts value parameter
  // ...
}
```

**2. Update `handleSave` in `KeyInput`** (line 95-101)

Pass the `localValue` directly to `onSave`:
```typescript
const handleSave = () => {
  if (localValue.trim()) {
    onChange(localValue);
    onSave(localValue);  // Pass value directly
    setIsEditing(false);
    setLocalValue('');
  }
};
```

**3. Update the callback in parent component** (line 304)

Receive the value from the child:
```typescript
onSave={(value) => handleSave(config.key, value)}
```

**4. Update the parent `handleSave` function** (around line 236-247)

Already accepts `value` as parameter, so no change needed there.

---

## Summary of Changes

| File | Lines | Change |
|------|-------|--------|
| `src/components/settings/APIKeysTab.tsx` | ~77 | Update `onSave` type in interface to `(value: string) => void` |
| `src/components/settings/APIKeysTab.tsx` | ~98 | Call `onSave(localValue)` instead of `onSave()` |
| `src/components/settings/APIKeysTab.tsx` | ~304 | Change callback to `(value) => handleSave(config.key, value)` |

---

## Expected Result

After this fix:
- API keys will be saved correctly to the database
- The edge function will retrieve the keys successfully
- Research feature will work using user's Perplexity/Gemini keys
- Error message "Research requires a Perplexity or Gemini API key" will only appear when keys genuinely aren't configured

