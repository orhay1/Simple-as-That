
-- Fix settings table: change unique constraint from (key) to (user_id, key)
-- This allows each user to have their own settings with the same keys
ALTER TABLE public.settings DROP CONSTRAINT settings_key_key;
ALTER TABLE public.settings ADD CONSTRAINT settings_user_key_unique UNIQUE (user_id, key);

-- Guardrails: Add unique constraint on user_id so each user has only one guardrails record
-- The useGuardrails hook expects one record per user
ALTER TABLE public.guardrails ADD CONSTRAINT guardrails_user_unique UNIQUE (user_id);
