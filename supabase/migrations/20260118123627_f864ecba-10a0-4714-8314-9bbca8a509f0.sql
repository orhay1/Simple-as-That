-- Step 1: Add user_id columns to all content tables (nullable first for migration)
ALTER TABLE public.post_drafts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.topic_ideas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.ai_news_items ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.guardrails ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.voice_profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.post_templates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Migrate existing data to the first user (the manager)
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  SELECT user_id INTO first_user_id FROM public.user_roles WHERE role = 'manager' LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    UPDATE public.post_drafts SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE public.topic_ideas SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE public.assets SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE public.publications SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE public.ai_news_items SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE public.guardrails SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE public.voice_profiles SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE public.post_templates SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE public.settings SET user_id = first_user_id WHERE user_id IS NULL;
  END IF;
END $$;

-- Step 3: Make user_id NOT NULL after migration
ALTER TABLE public.post_drafts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.topic_ideas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.assets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.publications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ai_news_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.guardrails ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.voice_profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.post_templates ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.settings ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Drop old RLS policies
DROP POLICY IF EXISTS "Authenticated users can view drafts" ON public.post_drafts;
DROP POLICY IF EXISTS "Editors and managers can manage drafts" ON public.post_drafts;

DROP POLICY IF EXISTS "Authenticated users can view topics" ON public.topic_ideas;
DROP POLICY IF EXISTS "Editors and managers can manage topics" ON public.topic_ideas;

DROP POLICY IF EXISTS "Authenticated users can view assets" ON public.assets;
DROP POLICY IF EXISTS "Editors and managers can manage assets" ON public.assets;

DROP POLICY IF EXISTS "Authenticated users can view publications" ON public.publications;
DROP POLICY IF EXISTS "Managers can manage publications" ON public.publications;

DROP POLICY IF EXISTS "Authenticated users can view news items" ON public.ai_news_items;
DROP POLICY IF EXISTS "Editors and managers can manage news items" ON public.ai_news_items;

DROP POLICY IF EXISTS "Authenticated users can view guardrails" ON public.guardrails;
DROP POLICY IF EXISTS "Managers can manage guardrails" ON public.guardrails;

DROP POLICY IF EXISTS "Authenticated users can view voice profiles" ON public.voice_profiles;
DROP POLICY IF EXISTS "Managers can manage voice profiles" ON public.voice_profiles;

DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.post_templates;
DROP POLICY IF EXISTS "Managers can manage templates" ON public.post_templates;

DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.settings;
DROP POLICY IF EXISTS "Managers can manage settings" ON public.settings;

-- Step 5: Create new user-ownership RLS policies

-- post_drafts policies
CREATE POLICY "Users can view own drafts" ON public.post_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own drafts" ON public.post_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON public.post_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON public.post_drafts FOR DELETE USING (auth.uid() = user_id);

-- topic_ideas policies
CREATE POLICY "Users can view own topics" ON public.topic_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topics" ON public.topic_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics" ON public.topic_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics" ON public.topic_ideas FOR DELETE USING (auth.uid() = user_id);

-- assets policies
CREATE POLICY "Users can view own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- publications policies
CREATE POLICY "Users can view own publications" ON public.publications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own publications" ON public.publications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own publications" ON public.publications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own publications" ON public.publications FOR DELETE USING (auth.uid() = user_id);

-- ai_news_items policies
CREATE POLICY "Users can view own news items" ON public.ai_news_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own news items" ON public.ai_news_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own news items" ON public.ai_news_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own news items" ON public.ai_news_items FOR DELETE USING (auth.uid() = user_id);

-- guardrails policies
CREATE POLICY "Users can view own guardrails" ON public.guardrails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own guardrails" ON public.guardrails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own guardrails" ON public.guardrails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own guardrails" ON public.guardrails FOR DELETE USING (auth.uid() = user_id);

-- voice_profiles policies
CREATE POLICY "Users can view own voice profiles" ON public.voice_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice profiles" ON public.voice_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice profiles" ON public.voice_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own voice profiles" ON public.voice_profiles FOR DELETE USING (auth.uid() = user_id);

-- post_templates policies
CREATE POLICY "Users can view own templates" ON public.post_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.post_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.post_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.post_templates FOR DELETE USING (auth.uid() = user_id);

-- settings policies
CREATE POLICY "Users can view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Update handle_new_user trigger to give every user manager role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Every user gets manager role for their own workspace
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'manager');
  
  RETURN NEW;
END;
$function$;