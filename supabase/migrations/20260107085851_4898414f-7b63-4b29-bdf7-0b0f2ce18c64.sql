-- Add source_url column to post_drafts to preserve the original tool URL
ALTER TABLE public.post_drafts ADD COLUMN source_url TEXT;