-- Add avatar_url and headline columns to linkedin_connections
ALTER TABLE public.linkedin_connections
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT;