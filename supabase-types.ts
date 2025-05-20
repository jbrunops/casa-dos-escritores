export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          updated_at: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          updated_at?: string
          userId: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          updated_at?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: number
          operation: string
          success: boolean
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: number
          operation: string
          success: boolean
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: number
          operation?: string
          success?: boolean
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          author_id: string
          chapter_number: number
          content: string | null
          created_at: string | null
          id: string
          series_id: string
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          chapter_number: number
          content?: string | null
          created_at?: string | null
          id?: string
          series_id: string
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          chapter_number?: number
          content?: string | null
          created_at?: string | null
          id?: string
          series_id?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          chapter_id: string | null
          created_at: string | null
          id: string
          parent_id: string | null
          series_id: string | null
          story_id: string | null
          text: string
        }
        Insert: {
          author_id?: string | null
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          series_id?: string | null
          story_id?: string | null
          text: string
        }
        Update: {
          author_id?: string | null
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string | null
          series_id?: string | null
          story_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          additional_data: Json | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          related_id: string | null
          sender_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          additional_data?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          sender_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          additional_data?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          related_id?: string | null
          sender_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          facebook_url: string | null
          first_name: string | null
          id: string
          instagram_url: string | null
          is_admin: boolean | null
          last_name: string | null
          role: string
          twitter_url: string | null
          updated_at: string | null
          username: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id: string
          instagram_url?: string | null
          is_admin?: boolean | null
          last_name?: string | null
          role?: string
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id?: string
          instagram_url?: string | null
          is_admin?: boolean | null
          last_name?: string | null
          role?: string
          twitter_url?: string | null
          updated_at?: string | null
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      series: {
        Row: {
          author_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          is_completed: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
          work_type: string | null
        }
        Insert: {
          author_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_completed?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          work_type?: string | null
        }
        Update: {
          author_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_completed?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          work_type?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          expires: string
          id: string
          sessionToken: string
          updated_at: string
          userId: string
        }
        Insert: {
          created_at?: string
          expires: string
          id?: string
          sessionToken: string
          updated_at?: string
          userId: string
        }
        Update: {
          created_at?: string
          expires?: string
          id?: string
          sessionToken?: string
          updated_at?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_id: string
          category: string | null
          chapter_number: number | null
          content: string
          created_at: string | null
          fts: unknown | null
          id: string
          is_part_of_series: boolean | null
          is_published: boolean | null
          is_series_finale: boolean | null
          series_id: string | null
          title: string
          updated_at: string | null
          view_count: number
        }
        Insert: {
          author_id: string
          category?: string | null
          chapter_number?: number | null
          content: string
          created_at?: string | null
          fts?: unknown | null
          id?: string
          is_part_of_series?: boolean | null
          is_published?: boolean | null
          is_series_finale?: boolean | null
          series_id?: string | null
          title: string
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string
          category?: string | null
          chapter_number?: number | null
          content?: string
          created_at?: string | null
          fts?: unknown | null
          id?: string
          is_part_of_series?: boolean | null
          is_published?: boolean | null
          is_series_finale?: boolean | null
          series_id?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          emailVerified: string | null
          id: string
          image: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          created_at: string
          expires: string
          identifier: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires: string
          identifier: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires?: string
          identifier?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      comments_with_author: {
        Row: {
          author_avatar_url: string | null
          author_id: string | null
          author_username: string | null
          chapter_id: string | null
          created_at: string | null
          id: string | null
          parent_id: string | null
          series_id: string | null
          story_id: string | null
          text: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_with_author"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      series_with_author: {
        Row: {
          author_id: string | null
          author_name: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string | null
          is_completed: boolean | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          view_count: number | null
          work_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_comment: {
        Args: { p_text: string; p_story_id: string; p_author_id: string }
        Returns: string
      }
      create_user_profile: {
        Args: { user_id: string; user_name: string; user_email: string }
        Returns: undefined
      }
      delete_auth_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      delete_user: {
        Args: { user_id: string }
        Returns: Json
      }
      ensure_user_exists: {
        Args: { user_id: string }
        Returns: undefined
      }
      get_most_commented_content: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          id: string
          title: string
          author_username: string
          type: string
          content: string
          created_at: string
          series_title: string
          chapter_number: number
          series_type: string
          comment_count: number
        }[]
      }
      get_most_commented_content_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_most_commented_content_old: {
        Args: { limit_count: number }
        Returns: {
          id: string
          title: string
          content: string
          created_at: string
          author_username: string
          type: string
          comment_count: number
          series_id: string
          series_title: string
          calculated_chapter_number: number
        }[]
      }
      get_popular_series_highlights: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          title: string
          cover_url: string
          genre: string
          view_count: number
          is_completed: boolean
          author_id: string
          author_username: string
          chapter_count: number
        }[]
      }
      get_recent_content: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          id: string
          title: string
          content: string
          author_username: string
          created_at: string
          type: string
          series_title: string
          chapter_number: number
          series_type: string
        }[]
      }
      get_recent_content_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_recent_content_old: {
        Args: { limit_count: number }
        Returns: {
          id: string
          title: string
          content: string
          created_at: string
          author_username: string
          type: string
          series_id: string
          series_title: string
          chapter_number: number
        }[]
      }
      get_top_writers: {
        Args: { p_limit: number; p_offset: number }
        Returns: {
          id: string
          username: string
          avatar_url: string
          content_count: number
        }[]
      }
      get_top_writers_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_top_writers_old: {
        Args: { limit_count: number }
        Returns: {
          author_id: string
          username: string
          avatar_url: string
          publication_count: number
        }[]
      }
      increment_chapter_view: {
        Args: { chapter_id_param: string }
        Returns: undefined
      }
      increment_chapter_views: {
        Args: { chapter_id: string }
        Returns: undefined
      }
      increment_story_view: {
        Args: { story_id_param: string }
        Returns: undefined
      }
      increment_view_count: {
        Args: Record<PropertyKey, never> | { story_id: string }
        Returns: undefined
      }
      search_stories: {
        Args: { search_query: string; page_limit: number; page_offset: number }
        Returns: {
          id: string
          title: string
          content: string
          created_at: string
          category: string
          username: string
          rank: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
