export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_output_ledger: {
        Row: {
          created_at: string
          created_entity_id: string | null
          created_entity_type: string | null
          generation_type: string
          id: string
          inputs: Json | null
          model: string | null
          parsed_output: Json | null
          raw_output: string | null
          system_prompt: string | null
          token_usage: Json | null
          user_prompt: string | null
        }
        Insert: {
          created_at?: string
          created_entity_id?: string | null
          created_entity_type?: string | null
          generation_type: string
          id?: string
          inputs?: Json | null
          model?: string | null
          parsed_output?: Json | null
          raw_output?: string | null
          system_prompt?: string | null
          token_usage?: Json | null
          user_prompt?: string | null
        }
        Update: {
          created_at?: string
          created_entity_id?: string | null
          created_entity_type?: string | null
          generation_type?: string
          id?: string
          inputs?: Json | null
          model?: string | null
          parsed_output?: Json | null
          raw_output?: string | null
          system_prompt?: string | null
          token_usage?: Json | null
          user_prompt?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          is_ai_generated: boolean | null
          metadata: Json | null
          prompt: string | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          is_ai_generated?: boolean | null
          metadata?: Json | null
          prompt?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          is_ai_generated?: boolean | null
          metadata?: Json | null
          prompt?: string | null
        }
        Relationships: []
      }
      guardrails: {
        Row: {
          allow_links: boolean | null
          banned_phrases: string[] | null
          created_at: string
          dedupe_threshold: number | null
          enforce_rules: boolean | null
          id: string
          max_hashtags: number | null
          no_clickbait: boolean | null
          required_disclaimers: string[] | null
          updated_at: string
        }
        Insert: {
          allow_links?: boolean | null
          banned_phrases?: string[] | null
          created_at?: string
          dedupe_threshold?: number | null
          enforce_rules?: boolean | null
          id?: string
          max_hashtags?: number | null
          no_clickbait?: boolean | null
          required_disclaimers?: string[] | null
          updated_at?: string
        }
        Update: {
          allow_links?: boolean | null
          banned_phrases?: string[] | null
          created_at?: string
          dedupe_threshold?: number | null
          enforce_rules?: boolean | null
          id?: string
          max_hashtags?: number | null
          no_clickbait?: boolean | null
          required_disclaimers?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      linkedin_connections: {
        Row: {
          access_token: string | null
          avatar_url: string | null
          connected_at: string | null
          created_at: string
          expires_at: string | null
          headline: string | null
          id: string
          is_connected: boolean | null
          profile_id: string | null
          profile_name: string | null
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          avatar_url?: string | null
          connected_at?: string | null
          created_at?: string
          expires_at?: string | null
          headline?: string | null
          id?: string
          is_connected?: boolean | null
          profile_id?: string | null
          profile_name?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          avatar_url?: string | null
          connected_at?: string | null
          created_at?: string
          expires_at?: string | null
          headline?: string | null
          id?: string
          is_connected?: boolean | null
          profile_id?: string | null
          profile_name?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_drafts: {
        Row: {
          body: string
          created_at: string
          hashtags_broad: string[] | null
          hashtags_niche: string[] | null
          hashtags_trending: string[] | null
          id: string
          image_asset_id: string | null
          image_description: string | null
          published_url: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status"]
          title: string
          topic_id: string | null
          updated_at: string
          versions: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          hashtags_broad?: string[] | null
          hashtags_niche?: string[] | null
          hashtags_trending?: string[] | null
          id?: string
          image_asset_id?: string | null
          image_description?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          topic_id?: string | null
          updated_at?: string
          versions?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          hashtags_broad?: string[] | null
          hashtags_niche?: string[] | null
          hashtags_trending?: string[] | null
          id?: string
          image_asset_id?: string | null
          image_description?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          topic_id?: string | null
          updated_at?: string
          versions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "post_drafts_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_drafts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      post_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          skeleton: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          skeleton: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          skeleton?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      publications: {
        Row: {
          comments: number | null
          created_at: string
          final_content: Json
          id: string
          impressions: number | null
          is_manual_publish: boolean | null
          likes: number | null
          notes: string | null
          post_draft_id: string | null
          published_at: string | null
          published_url: string | null
          updated_at: string
        }
        Insert: {
          comments?: number | null
          created_at?: string
          final_content: Json
          id?: string
          impressions?: number | null
          is_manual_publish?: boolean | null
          likes?: number | null
          notes?: string | null
          post_draft_id?: string | null
          published_at?: string | null
          published_url?: string | null
          updated_at?: string
        }
        Update: {
          comments?: number | null
          created_at?: string
          final_content?: Json
          id?: string
          impressions?: number | null
          is_manual_publish?: boolean | null
          likes?: number | null
          notes?: string | null
          post_draft_id?: string | null
          published_at?: string | null
          published_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_post_draft_id_fkey"
            columns: ["post_draft_id"]
            isOneToOne: false
            referencedRelation: "post_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      topic_ideas: {
        Row: {
          created_at: string
          hook: string | null
          id: string
          rationale: string | null
          source_generation_id: string | null
          status: Database["public"]["Enums"]["topic_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hook?: string | null
          id?: string
          rationale?: string | null
          source_generation_id?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hook?: string | null
          id?: string
          rationale?: string | null
          source_generation_id?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_ideas_source_generation_id_fkey"
            columns: ["source_generation_id"]
            isOneToOne: false
            referencedRelation: "ai_output_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_profiles: {
        Row: {
          banned_phrases: string[] | null
          created_at: string
          donts: string | null
          dos: string | null
          examples: string | null
          id: string
          is_active: boolean | null
          name: string
          tone_rules: string | null
          updated_at: string
        }
        Insert: {
          banned_phrases?: string[] | null
          created_at?: string
          donts?: string | null
          dos?: string | null
          examples?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tone_rules?: string | null
          updated_at?: string
        }
        Update: {
          banned_phrases?: string[] | null
          created_at?: string
          donts?: string | null
          dos?: string | null
          examples?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tone_rules?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "manager" | "editor" | "viewer"
      creativity_preset: "conservative" | "balanced" | "bold"
      cta_style: "question" | "soft" | "none"
      emoji_usage: "none" | "light" | "normal"
      jargon_level: "low" | "medium" | "high"
      post_status:
        | "draft"
        | "in_review"
        | "approved"
        | "scheduled"
        | "published"
      tone_style: "founder" | "educational" | "contrarian" | "story"
      topic_status: "new" | "shortlisted" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["manager", "editor", "viewer"],
      creativity_preset: ["conservative", "balanced", "bold"],
      cta_style: ["question", "soft", "none"],
      emoji_usage: ["none", "light", "normal"],
      jargon_level: ["low", "medium", "high"],
      post_status: ["draft", "in_review", "approved", "scheduled", "published"],
      tone_style: ["founder", "educational", "contrarian", "story"],
      topic_status: ["new", "shortlisted", "archived"],
    },
  },
} as const
