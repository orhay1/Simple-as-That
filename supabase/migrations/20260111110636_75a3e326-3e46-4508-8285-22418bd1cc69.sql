-- Add news_item_id to post_drafts to link drafts to their source research
ALTER TABLE post_drafts ADD COLUMN news_item_id uuid REFERENCES ai_news_items(id);