-- Add language column to post_drafts table
ALTER TABLE post_drafts ADD COLUMN language text DEFAULT 'en';

-- Add language preferences to profiles table
ALTER TABLE profiles ADD COLUMN ui_language text DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN content_language text DEFAULT 'en';