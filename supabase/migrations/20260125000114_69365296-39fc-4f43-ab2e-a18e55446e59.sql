-- Add ON DELETE CASCADE foreign keys to all user-related tables
-- First, we need to add foreign key constraints that cascade deletes

-- profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey,
ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- post_drafts table
ALTER TABLE public.post_drafts
DROP CONSTRAINT IF EXISTS post_drafts_user_id_fkey,
ADD CONSTRAINT post_drafts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- assets table
ALTER TABLE public.assets
DROP CONSTRAINT IF EXISTS assets_user_id_fkey,
ADD CONSTRAINT assets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- publications table
ALTER TABLE public.publications
DROP CONSTRAINT IF EXISTS publications_user_id_fkey,
ADD CONSTRAINT publications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ai_output_ledger table
ALTER TABLE public.ai_output_ledger
DROP CONSTRAINT IF EXISTS ai_output_ledger_user_id_fkey,
ADD CONSTRAINT ai_output_ledger_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- topic_ideas table
ALTER TABLE public.topic_ideas
DROP CONSTRAINT IF EXISTS topic_ideas_user_id_fkey,
ADD CONSTRAINT topic_ideas_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ai_news_items table
ALTER TABLE public.ai_news_items
DROP CONSTRAINT IF EXISTS ai_news_items_user_id_fkey,
ADD CONSTRAINT ai_news_items_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- guardrails table
ALTER TABLE public.guardrails
DROP CONSTRAINT IF EXISTS guardrails_user_id_fkey,
ADD CONSTRAINT guardrails_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- settings table
ALTER TABLE public.settings
DROP CONSTRAINT IF EXISTS settings_user_id_fkey,
ADD CONSTRAINT settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- voice_profiles table
ALTER TABLE public.voice_profiles
DROP CONSTRAINT IF EXISTS voice_profiles_user_id_fkey,
ADD CONSTRAINT voice_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- post_templates table
ALTER TABLE public.post_templates
DROP CONSTRAINT IF EXISTS post_templates_user_id_fkey,
ADD CONSTRAINT post_templates_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- linkedin_connections table
ALTER TABLE public.linkedin_connections
DROP CONSTRAINT IF EXISTS linkedin_connections_user_id_fkey,
ADD CONSTRAINT linkedin_connections_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable the pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function that calls the edge function to delete storage files
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_role_key TEXT;
  supabase_url TEXT;
BEGIN
  -- Get the service role key and URL from vault or use environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings aren't available, try to get from secrets
  IF supabase_url IS NULL THEN
    supabase_url := 'https://mtoqksifrpvkskhmchwj.supabase.co';
  END IF;
  
  -- Call the edge function to delete storage files
  -- Using pg_net to make async HTTP call
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/cleanup-user-storage',
    body := json_build_object('user_id', OLD.id)::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    )::jsonb
  );
  
  RETURN OLD;
END;
$$;

-- Create the trigger on auth.users table
-- Note: This trigger fires BEFORE DELETE so we can clean up storage before the cascade
DROP TRIGGER IF EXISTS on_user_deleted ON auth.users;
CREATE TRIGGER on_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();