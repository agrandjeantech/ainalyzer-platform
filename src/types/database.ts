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
      analyses: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          analysis_type_id: string
          annotations: Json
          created_at: string
          duration_ms: number
          id: string
          image_id: string
          processing_time_ms: number | null
          provider: string
          result_json: Json
          status: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          analysis_type_id: string
          annotations?: Json
          created_at?: string
          duration_ms: number
          id?: string
          image_id: string
          processing_time_ms?: number | null
          provider: string
          result_json?: Json
          status?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          analysis_type_id?: string
          annotations?: Json
          created_at?: string
          duration_ms?: number
          id?: string
          image_id?: string
          processing_time_ms?: number | null
          provider?: string
          result_json?: Json
          status?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_analysis_type_id_fkey"
            columns: ["analysis_type_id"]
            isOneToOne: false
            referencedRelation: "analysis_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          }
        ]
      }
      analysis_types: {
        Row: {
          active: boolean | null
          category: string
          created_at: string
          description: string
          id: string
          name: string
          system_prompt: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string
          description: string
          id?: string
          name: string
          system_prompt: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          system_prompt?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          active: boolean | null
          created_at: string
          encrypted_key: string
          id: string
          last_used: string | null
          name: string
          provider: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          encrypted_key: string
          id?: string
          last_used?: string | null
          name: string
          provider: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          encrypted_key?: string
          id?: string
          last_used?: string | null
          name?: string
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          }
        ]
      }
      images: {
        Row: {
          file_hash: string | null
          format: string
          id: string
          metadata: Json
          original_name: string
          public_url: string | null
          size_bytes: number
          status: string
          storage_bucket: string | null
          storage_path: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_hash?: string | null
          format: string
          id?: string
          metadata?: Json
          original_name: string
          public_url?: string | null
          size_bytes: number
          status?: string
          storage_bucket?: string | null
          storage_path: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_hash?: string | null
          format?: string
          id?: string
          metadata?: Json
          original_name?: string
          public_url?: string | null
          size_bytes?: number
          status?: string
          storage_bucket?: string | null
          storage_path?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          }
        ]
      }
      login_history: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string
          logout_at: string | null
          session_duration: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string
          logout_at?: string | null
          session_duration?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string
          logout_at?: string | null
          session_duration?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          }
        ]
      }
      user_activities: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      recent_analyses: {
        Row: {
          analysis_type: string | null
          created_at: string | null
          duration_ms: number | null
          id: string | null
          image_name: string | null
          provider: string | null
          status: string | null
          user_email: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_analysis_type_id_fkey"
            columns: ["analysis_type_id"]
            isOneToOne: false
            referencedRelation: "analysis_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          }
        ]
      }
      user_stats: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string | null
          last_login: string | null
          role: string | null
          status: string | null
          total_analyses: number | null
          total_api_keys: number | null
          total_images: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      decrypt_api_key: {
        Args: {
          encrypted_key: string
          encryption_key: string
        }
        Returns: string
      }
      encrypt_api_key: {
        Args: {
          api_key: string
          encryption_key: string
        }
        Returns: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never
