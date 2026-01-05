-- Create ai_news_items table for storing discovered AI news
CREATE TABLE public.ai_news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  full_content TEXT,
  source_url TEXT,
  source_name TEXT,
  tool_name TEXT,
  published_date TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'new',
  raw_perplexity_response JSONB,
  raw_firecrawl_response JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_news_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_news_items (shared team resource)
CREATE POLICY "Authenticated users can view news items"
ON public.ai_news_items
FOR SELECT
USING (true);

CREATE POLICY "Editors and managers can manage news items"
ON public.ai_news_items
FOR ALL
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Add foreign key to topic_ideas to track which news item a topic came from
ALTER TABLE public.topic_ideas ADD COLUMN news_item_id UUID REFERENCES public.ai_news_items(id);