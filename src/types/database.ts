// Custom types extending Supabase generated types

export interface DraftVersion {
  id: string;
  label: string;
  body: string;
  language: string;
  created_at: string;
}

export type TopicStatus = 'new' | 'shortlisted' | 'archived';
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published';
export type ToneStyle = 'founder' | 'educational' | 'contrarian' | 'story';
export type CtaStyle = 'question' | 'soft' | 'none';
export type JargonLevel = 'low' | 'medium' | 'high';
export type EmojiUsage = 'none' | 'light' | 'normal';
export type CreativityPreset = 'conservative' | 'balanced' | 'bold';

export interface TopicIdea {
  id: string;
  user_id: string;
  title: string;
  rationale: string | null;
  hook: string | null;
  status: TopicStatus;
  tags: string[] | null;
  source_generation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostDraft {
  id: string;
  user_id: string;
  topic_id: string | null;
  news_item_id: string | null;
  title: string;
  body: string;
  hashtags_broad: string[] | null;
  hashtags_niche: string[] | null;
  hashtags_trending: string[] | null;
  image_description: string | null;
  image_asset_id: string | null;
  source_url: string | null;
  status: PostStatus;
  scheduled_at: string | null;
  published_url: string | null;
  versions: any[];
  language: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostDraftWithAsset extends PostDraft {
  image_asset?: {
    id: string;
    file_url: string | null;
    prompt: string | null;
  } | null;
}

export interface Asset {
  id: string;
  user_id: string;
  file_url: string | null;
  prompt: string | null;
  metadata: Record<string, any>;
  is_ai_generated: boolean;
  created_at: string;
}

export interface Publication {
  id: string;
  user_id: string;
  post_draft_id: string | null;
  final_content: Record<string, any>;
  published_url: string | null;
  published_at: string;
  likes: number;
  comments: number;
  impressions: number;
  notes: string | null;
  is_manual_publish: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIOutputLedger {
  id: string;
  generation_type: string;
  system_prompt: string | null;
  user_prompt: string | null;
  inputs: Record<string, any>;
  model: string | null;
  raw_output: string | null;
  parsed_output: any;
  token_usage: Record<string, any>;
  created_entity_type: string | null;
  created_entity_id: string | null;
  created_at: string;
}

export interface VoiceProfile {
  id: string;
  user_id: string;
  name: string;
  tone_rules: string | null;
  dos: string | null;
  donts: string | null;
  examples: string | null;
  banned_phrases: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Guardrails {
  id: string;
  user_id: string;
  banned_phrases: string[] | null;
  required_disclaimers: string[] | null;
  allow_links: boolean;
  max_hashtags: number;
  no_clickbait: boolean;
  enforce_rules: boolean;
  dedupe_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface PostTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  skeleton: string;
  is_active: boolean;
  created_at: string;
}


export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  ui_language: string | null;
  content_language: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  full_content: string | null;
  source_url: string | null;
  official_url: string | null;
  source_name: string | null;
  tool_name: string | null;
  published_date: string | null;
  discovered_at: string | null;
  status: string | null;
  tags: string[] | null;
  raw_perplexity_response: any;
  raw_firecrawl_response: any;
  created_at: string;
}
