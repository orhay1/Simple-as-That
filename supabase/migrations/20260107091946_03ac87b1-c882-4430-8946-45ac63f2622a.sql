-- Add official_url column to ai_news_items table for storing the tool's actual website
ALTER TABLE ai_news_items ADD COLUMN IF NOT EXISTS official_url text;