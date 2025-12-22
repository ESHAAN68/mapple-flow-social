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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          board_id: string | null
          created_at: string | null
          id: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          board_id?: string | null
          created_at?: string | null
          id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          board_id?: string | null
          created_at?: string | null
          id?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      board_collaborators: {
        Row: {
          board_id: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          permission: string | null
          user_id: string | null
        }
        Insert: {
          board_id?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          permission?: string | null
          user_id?: string | null
        }
        Update: {
          board_id?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          permission?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_collaborators_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          canvas_data: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          is_template: boolean | null
          owner_id: string | null
          team_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          owner_id?: string | null
          team_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          owner_id?: string | null
          team_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_objects: {
        Row: {
          board_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          object_data: Json
          object_id: string
          object_type: string
          updated_at: string | null
        }
        Insert: {
          board_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          object_data: Json
          object_id: string
          object_type: string
          updated_at?: string | null
        }
        Update: {
          board_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          object_data?: Json
          object_id?: string
          object_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_objects_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          encryption_key_hash: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encryption_key_hash: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encryption_key_hash?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      encrypted_messages: {
        Row: {
          conversation_id: string
          created_at: string
          encrypted_content: string
          id: string
          message_type: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          encrypted_content: string
          id?: string
          message_type?: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          encrypted_content?: string
          id?: string
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          board_id: string | null
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          parent_id: string | null
          sender_id: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          board_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          parent_id?: string | null
          sender_id?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          board_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          parent_id?: string | null
          sender_id?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: string[] | null
          bio: string | null
          company: string | null
          created_at: string | null
          custom_status: string | null
          display_name: string | null
          id: string
          last_seen: string | null
          location: string | null
          privacy_settings: Json | null
          profile_banner: string | null
          pronouns: string | null
          skills: string[] | null
          social_links: Json | null
          spotify_connected_at: string | null
          spotify_country: string | null
          spotify_display_name: string | null
          spotify_email: string | null
          spotify_premium: boolean | null
          spotify_user_id: string | null
          status: string | null
          theme_color: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          custom_status?: string | null
          display_name?: string | null
          id: string
          last_seen?: string | null
          location?: string | null
          privacy_settings?: Json | null
          profile_banner?: string | null
          pronouns?: string | null
          skills?: string[] | null
          social_links?: Json | null
          spotify_connected_at?: string | null
          spotify_country?: string | null
          spotify_display_name?: string | null
          spotify_email?: string | null
          spotify_premium?: boolean | null
          spotify_user_id?: string | null
          status?: string | null
          theme_color?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          custom_status?: string | null
          display_name?: string | null
          id?: string
          last_seen?: string | null
          location?: string | null
          privacy_settings?: Json | null
          profile_banner?: string | null
          pronouns?: string | null
          skills?: string[] | null
          social_links?: Json | null
          spotify_connected_at?: string | null
          spotify_country?: string | null
          spotify_display_name?: string | null
          spotify_email?: string | null
          spotify_premium?: boolean | null
          spotify_user_id?: string | null
          status?: string | null
          theme_color?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      spotify_credentials: {
        Row: {
          access_token: string
          connected_at: string | null
          id: string
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          id?: string
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          message_type: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_type?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_type?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          board_id: string | null
          cursor_x: number | null
          cursor_y: number | null
          id: string
          last_active: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          board_id?: string | null
          cursor_x?: number | null
          cursor_y?: number | null
          id?: string
          last_active?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          board_id?: string | null
          cursor_x?: number | null
          cursor_y?: number | null
          id?: string
          last_active?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_calls: {
        Row: {
          caller_id: string
          conversation_id: string
          ended_at: string | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          caller_id: string
          conversation_id: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          caller_id?: string
          conversation_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_access_board: {
        Args: { board_id: string; user_id: string }
        Returns: boolean
      }
      is_board_collaborator: {
        Args: { board_id: string; user_id: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { conversation_id: string; user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { team_id: string; user_id: string }
        Returns: boolean
      }
      start_conversation: { Args: { other_user_id: string }; Returns: string }
      user_can_view_conversation_participants: {
        Args: { conversation_id: string; requesting_user_id: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
