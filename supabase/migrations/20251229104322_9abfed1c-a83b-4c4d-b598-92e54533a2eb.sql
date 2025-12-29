
-- Create enum types
CREATE TYPE public.app_role AS ENUM ('manager', 'editor', 'viewer');
CREATE TYPE public.topic_status AS ENUM ('new', 'shortlisted', 'archived');
CREATE TYPE public.post_status AS ENUM ('draft', 'in_review', 'approved', 'scheduled', 'published');
CREATE TYPE public.tone_style AS ENUM ('founder', 'educational', 'contrarian', 'story');
CREATE TYPE public.cta_style AS ENUM ('question', 'soft', 'none');
CREATE TYPE public.jargon_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.emoji_usage AS ENUM ('none', 'light', 'normal');
CREATE TYPE public.creativity_preset AS ENUM ('conservative', 'balanced', 'bold');

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Voice profiles for content generation
CREATE TABLE public.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tone_rules TEXT,
  dos TEXT,
  donts TEXT,
  examples TEXT,
  banned_phrases TEXT[],
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settings table for prompts and configurations
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LinkedIn connection info
CREATE TABLE public.linkedin_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  profile_name TEXT,
  profile_id TEXT,
  connected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Assets (images) table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT,
  prompt TEXT,
  metadata JSONB DEFAULT '{}',
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Output Ledger for full transparency
CREATE TABLE public.ai_output_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type TEXT NOT NULL, -- 'topic', 'draft', 'hashtag', 'image', 'rewrite'
  system_prompt TEXT,
  user_prompt TEXT,
  inputs JSONB DEFAULT '{}',
  model TEXT,
  raw_output TEXT,
  parsed_output JSONB,
  token_usage JSONB DEFAULT '{}',
  created_entity_type TEXT, -- 'topic_idea', 'post_draft', 'asset'
  created_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Topic ideas table
CREATE TABLE public.topic_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  rationale TEXT,
  hook TEXT,
  status topic_status NOT NULL DEFAULT 'new',
  tags TEXT[],
  source_generation_id UUID REFERENCES public.ai_output_ledger(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post drafts table
CREATE TABLE public.post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topic_ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  hashtags_broad TEXT[],
  hashtags_niche TEXT[],
  hashtags_trending TEXT[],
  image_description TEXT,
  image_asset_id UUID REFERENCES public.assets(id),
  status post_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_url TEXT,
  versions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Publications (published posts with metrics)
CREATE TABLE public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_draft_id UUID REFERENCES public.post_drafts(id) ON DELETE SET NULL,
  final_content JSONB NOT NULL,
  published_url TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  notes TEXT,
  is_manual_publish BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guardrails configuration
CREATE TABLE public.guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banned_phrases TEXT[],
  required_disclaimers TEXT[],
  allow_links BOOLEAN DEFAULT true,
  max_hashtags INTEGER DEFAULT 5,
  no_clickbait BOOLEAN DEFAULT true,
  enforce_rules BOOLEAN DEFAULT false,
  dedupe_threshold REAL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post templates
CREATE TABLE public.post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  skeleton TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_output_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any role (authenticated user check)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS Policies

-- Profiles: users can view all, update own
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles: only managers can manage, all can view
CREATE POLICY "Authenticated users can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- Voice profiles: all authenticated can view, managers can manage
CREATE POLICY "Authenticated users can view voice profiles" ON public.voice_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage voice profiles" ON public.voice_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- Settings: all authenticated can view, managers can manage
CREATE POLICY "Authenticated users can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage settings" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- LinkedIn connections: users manage their own
CREATE POLICY "Users can view own linkedin connection" ON public.linkedin_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own linkedin connection" ON public.linkedin_connections FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Assets: all authenticated can view and create
CREATE POLICY "Authenticated users can view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors and managers can manage assets" ON public.assets FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'editor')
);

-- AI Output Ledger: all authenticated can view and create
CREATE POLICY "Authenticated users can view ai ledger" ON public.ai_output_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors and managers can create ai entries" ON public.ai_output_ledger FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'editor')
);

-- Topic ideas: all can view, editors/managers can manage
CREATE POLICY "Authenticated users can view topics" ON public.topic_ideas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors and managers can manage topics" ON public.topic_ideas FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'editor')
);

-- Post drafts: all can view, editors/managers can manage
CREATE POLICY "Authenticated users can view drafts" ON public.post_drafts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors and managers can manage drafts" ON public.post_drafts FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'editor')
);

-- Publications: all can view, managers can manage
CREATE POLICY "Authenticated users can view publications" ON public.publications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage publications" ON public.publications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- Guardrails: all can view, managers can manage
CREATE POLICY "Authenticated users can view guardrails" ON public.guardrails FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage guardrails" ON public.guardrails FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- Post templates: all can view, managers can manage
CREATE POLICY "Authenticated users can view templates" ON public.post_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage templates" ON public.post_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_voice_profiles_updated_at BEFORE UPDATE ON public.voice_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_linkedin_connections_updated_at BEFORE UPDATE ON public.linkedin_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_topic_ideas_updated_at BEFORE UPDATE ON public.topic_ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_post_drafts_updated_at BEFORE UPDATE ON public.post_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON public.publications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_guardrails_updated_at BEFORE UPDATE ON public.guardrails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile and assign manager role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- First user gets manager role, subsequent users get editor
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'manager');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'editor');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default settings with prompts from n8n workflow
INSERT INTO public.settings (key, value, description) VALUES
('topic_generator_prompt', '"You are a Content Researcher Assistant at Agentic Vibe, an AI-first automation agency helping solopreneurs, creators, and digital-first founders grow their online presence — especially on LinkedIn — through scalable, hands-free content systems.\n\nYour task is to generate high-value content topics that align with our brand pillars and resonate deeply with our audience. These topics will later be expanded into posts by another agent.\n\n🔍 What to Focus On:\nGenerate content topics (not full content) based on these strategic themes:\n\nAI for Content Creation & Workflow Automation\n\nLinkedIn Automation Tools, Tactics & Growth Strategies\n\nSolopreneur Productivity Hacks Using AI & Automation\n\nSystems Thinking for Scaling Personal Brands\n\nThe Future of Work, Creators, and Automated Influence\n\nNo-Code Tools for Content & Lead Gen Automation\n\n✅ Your Output Per Topic:\nFor each idea, generate the following:\n\nTopic Title or Core Idea (1 line)\n\nShort Rationale (1–2 sentences on why this topic matters)\n\nSuggested Angle or Hook (1 LinkedIn-style framing or contrarian take)\n\n💡 Style Guide:\nKeep ideas insightful, actionable, and future-minded\n\nFavor founder-style energy: confident, sharp, and slightly contrarian when it adds value\n\nAvoid hype or jargon — focus on clarity, systemized insight, and utility"', 'System prompt for generating topic ideas'),
('draft_generator_prompt', '"You are a LinkedIn content creator and copywriter. Given a topic title, rationale, and suggested hook, generate text content for a LinkedIn post. Also describe a suitable image for the post."', 'System prompt for generating post drafts'),
('hashtag_generator_prompt', '"You are an SEO specialist for LinkedIn. Your task is to generate highly relevant and effective hashtags for the following post. Consider the post''s content, target audience, and current LinkedIn trends to maximize visibility and engagement.\n\nPlease generate:\n1. **3-5 broad, high-volume hashtags** (e.g., #AI, #Marketing, #Business)\n2. **3-5 niche-specific hashtags** that are directly relevant to the post''s core topic\n3. **1-2 trending/topical hashtags** if applicable\n\nPresent them categorized."', 'System prompt for generating hashtags'),
('image_generator_prompt', '"Generate an image for a LinkedIn post. The image should be professional, realistic, and suitable for LinkedIn. Description: {imageDescription}"', 'Template for image generation'),
('topics_per_run', '5', 'Number of topics to generate per run'),
('creativity_preset', '"balanced"', 'Default creativity level (conservative/balanced/bold)'),
('default_tone', '"founder"', 'Default tone style'),
('default_cta_style', '"question"', 'Default call-to-action style'),
('default_jargon_level', '"low"', 'Default jargon level'),
('default_emoji_usage', '"light"', 'Default emoji usage'),
('max_length_target', '"medium"', 'Default post length target');

-- Insert default guardrails
INSERT INTO public.guardrails (banned_phrases, required_disclaimers, allow_links, max_hashtags, no_clickbait, enforce_rules, dedupe_threshold) VALUES
(ARRAY['guaranteed results', 'get rich quick', 'limited time only'], ARRAY[]::TEXT[], true, 5, true, false, 0.8);

-- Insert default post templates
INSERT INTO public.post_templates (name, description, skeleton) VALUES
('Contrarian Take', 'Challenge conventional wisdom', 'Everyone says [common belief].\n\nBut here''s what they''re missing:\n\n[Your insight]\n\n[Evidence/Example]\n\n[Call to action]'),
('How-To', 'Step-by-step actionable guide', 'Here''s how to [achieve result] in [timeframe]:\n\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\n[Bonus tip]\n\n[Call to action]'),
('Story', 'Personal narrative with lesson', '[Hook: Unexpected moment]\n\n[Context: What led to this]\n\n[The turning point]\n\n[The lesson learned]\n\n[How this applies to the reader]'),
('Framework', 'Introduce a mental model or system', 'The [Name] Framework for [Result]:\n\n📌 [Principle 1]\n📌 [Principle 2]\n📌 [Principle 3]\n\n[Why this works]\n\n[Call to action]');
