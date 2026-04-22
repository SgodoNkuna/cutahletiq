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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      consent_log: {
        Row: {
          changed_at: string
          consent_coach_training: boolean
          consent_physio_health: boolean
          id: string
          source: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          consent_coach_training: boolean
          consent_physio_health: boolean
          id?: string
          source?: string
          user_id: string
        }
        Update: {
          changed_at?: string
          consent_coach_training?: boolean
          consent_physio_health?: boolean
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_log: {
        Row: {
          accessed_at: string
          action: string
          actor_id: string
          context: string | null
          id: string
          resource: string
          subject_id: string
        }
        Insert: {
          accessed_at?: string
          action?: string
          actor_id: string
          context?: string | null
          id?: string
          resource: string
          subject_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          actor_id?: string
          context?: string | null
          id?: string
          resource?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_access_log_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          order_index: number
          reps: number
          session_id: string
          sets: number
          weight_kg: number | null
          weight_pct: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          order_index?: number
          reps?: number
          session_id: string
          sets?: number
          weight_kg?: number | null
          weight_pct?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          reps?: number
          session_id?: string
          sets?: number
          weight_kg?: number | null
          weight_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      injury_checkins: {
        Row: {
          athlete_id: string
          body_regions: string[]
          id: string
          notes: string | null
          pain_level: number
          submitted_at: string
        }
        Insert: {
          athlete_id: string
          body_regions?: string[]
          id?: string
          notes?: string | null
          pain_level: number
          submitted_at?: string
        }
        Update: {
          athlete_id?: string
          body_regions?: string[]
          id?: string
          notes?: string | null
          pain_level?: number
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "injury_checkins_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      injury_records: {
        Row: {
          actual_rtp_date: string | null
          athlete_id: string
          body_region: string
          created_at: string
          date_of_injury: string
          expected_rtp_date: string | null
          id: string
          injury_type: string
          physio_id: string
          rtp_status: Database["public"]["Enums"]["rtp_status"]
          severity: number
          treatment_notes: string | null
          updated_at: string
        }
        Insert: {
          actual_rtp_date?: string | null
          athlete_id: string
          body_region: string
          created_at?: string
          date_of_injury: string
          expected_rtp_date?: string | null
          id?: string
          injury_type: string
          physio_id: string
          rtp_status?: Database["public"]["Enums"]["rtp_status"]
          severity: number
          treatment_notes?: string | null
          updated_at?: string
        }
        Update: {
          actual_rtp_date?: string | null
          athlete_id?: string
          body_region?: string
          created_at?: string
          date_of_injury?: string
          expected_rtp_date?: string | null
          id?: string
          injury_type?: string
          physio_id?: string
          rtp_status?: Database["public"]["Enums"]["rtp_status"]
          severity?: number
          treatment_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "injury_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injury_records_physio_id_fkey"
            columns: ["physio_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nudges: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_path: string | null
          message: string
          recipient_id: string
          sender_id: string | null
          type: Database["public"]["Enums"]["nudge_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_path?: string | null
          message: string
          recipient_id: string
          sender_id?: string | null
          type: Database["public"]["Enums"]["nudge_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_path?: string | null
          message?: string
          recipient_id?: string
          sender_id?: string | null
          type?: Database["public"]["Enums"]["nudge_type"]
        }
        Relationships: [
          {
            foreignKeyName: "nudges_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudges_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string
          athlete_id: string
          exercise_name: string
          id: string
          reps: number
          weight_kg: number
        }
        Insert: {
          achieved_at?: string
          athlete_id: string
          exercise_name: string
          id?: string
          reps: number
          weight_kg: number
        }
        Update: {
          achieved_at?: string
          athlete_id?: string
          exercise_name?: string
          id?: string
          reps?: number
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consent_at: string | null
          consent_coach_training: boolean
          consent_physio_health: boolean
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          onboarding_complete: boolean
          position: string | null
          role: Database["public"]["Enums"]["app_role"]
          sport: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          consent_at?: string | null
          consent_coach_training?: boolean
          consent_physio_health?: boolean
          created_at?: string
          email: string
          first_name?: string
          id: string
          last_name?: string
          onboarding_complete?: boolean
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          sport?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          consent_at?: string | null
          consent_coach_training?: boolean
          consent_physio_health?: boolean
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          onboarding_complete?: boolean
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          sport?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      programmes: {
        Row: {
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          sport: string | null
          start_date: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          sport?: string | null
          start_date?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          sport?: string | null
          start_date?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          programme_id: string
          session_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          programme_id: string
          session_date: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          programme_id?: string
          session_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          join_code: string
          name: string
          sport: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          join_code: string
          name: string
          sport: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          sport?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          actual_reps: number
          actual_weight_kg: number
          athlete_id: string
          exercise_id: string
          id: string
          is_pr: boolean
          logged_at: string
          session_id: string
          set_number: number
        }
        Insert: {
          actual_reps: number
          actual_weight_kg: number
          athlete_id: string
          exercise_id: string
          id?: string
          is_pr?: boolean
          logged_at?: string
          session_id: string
          set_number: number
        }
        Update: {
          actual_reps?: number
          actual_weight_kg?: number
          athlete_id?: string
          exercise_id?: string
          id?: string
          is_pr?: boolean
          logged_at?: string
          session_id?: string
          set_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      rtp_status_view: {
        Row: {
          athlete_id: string | null
          expected_rtp_date: string | null
          rtp_status: Database["public"]["Enums"]["rtp_status"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "injury_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      find_team_by_code: {
        Args: { _code: string }
        Returns: {
          coach_id: string
          id: string
          name: string
          sport: string
        }[]
      }
      generate_join_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_team_id: { Args: never; Returns: string }
      team_rtp_pulse: {
        Args: never
        Returns: {
          athlete_id: string
          expected_rtp_date: string
          rtp_status: Database["public"]["Enums"]["rtp_status"]
        }[]
      }
      user_team_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "athlete" | "coach" | "physio" | "admin"
      nudge_type:
        | "new_programme"
        | "pr_achieved"
        | "missed_session"
        | "rtp_status_change"
        | "injury_flagged"
        | "checkin_reminder"
      rtp_status: "unavailable" | "modified" | "cleared"
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
      app_role: ["athlete", "coach", "physio", "admin"],
      nudge_type: [
        "new_programme",
        "pr_achieved",
        "missed_session",
        "rtp_status_change",
        "injury_flagged",
        "checkin_reminder",
      ],
      rtp_status: ["unavailable", "modified", "cleared"],
    },
  },
} as const
