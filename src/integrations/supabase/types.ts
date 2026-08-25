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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      airlines: {
        Row: {
          country: string | null
          created_at: string
          iata_code: string | null
          id: string
          name: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          iata_code?: string | null
          id?: string
          name: string
        }
        Update: {
          country?: string | null
          created_at?: string
          iata_code?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bank_details: {
        Row: {
          account_holder: string
          account_number: string
          bank_name: string
          claim_id: string
          country: string
          created_at: string
          currency: string
          id: string
          swift_bic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder: string
          account_number: string
          bank_name: string
          claim_id: string
          country: string
          created_at?: string
          currency: string
          id?: string
          swift_bic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          claim_id?: string
          country?: string
          created_at?: string
          currency?: string
          id?: string
          swift_bic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_details_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: true
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_activity: {
        Row: {
          actor_id: string | null
          claim_id: string
          created_at: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          actor_id?: string | null
          claim_id: string
          created_at?: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          actor_id?: string | null
          claim_id?: string
          created_at?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_activity_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_documents: {
        Row: {
          claim_id: string
          content_type: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          user_id: string
        }
        Insert: {
          claim_id: string
          content_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          user_id: string
        }
        Update: {
          claim_id?: string
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_documents_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_notes: {
        Row: {
          claim_id: string
          created_at: string
          notes: string
          updated_at: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          notes?: string
          updated_at?: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_notes_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: true
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          actual_payout_received_at: string | null
          airline_name: string
          arrival_airport: string
          bank_details_submitted_at: string | null
          compensation_amount: number | null
          compensation_currency: string | null
          created_at: string
          departure_airport: string
          description: string | null
          expected_payout_window: string | null
          fee_status: string
          flight_date: string
          flight_number: string
          id: string
          is_refundable: boolean
          issue_type: string
          jetclaim_fee_amount: number | null
          reference: string
          regulation_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_payout_received_at?: string | null
          airline_name: string
          arrival_airport: string
          bank_details_submitted_at?: string | null
          compensation_amount?: number | null
          compensation_currency?: string | null
          created_at?: string
          departure_airport: string
          description?: string | null
          expected_payout_window?: string | null
          fee_status?: string
          flight_date: string
          flight_number: string
          id?: string
          is_refundable?: boolean
          issue_type: string
          jetclaim_fee_amount?: number | null
          reference?: string
          regulation_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_payout_received_at?: string | null
          airline_name?: string
          arrival_airport?: string
          bank_details_submitted_at?: string | null
          compensation_amount?: number | null
          compensation_currency?: string | null
          created_at?: string
          departure_airport?: string
          description?: string | null
          expected_payout_window?: string | null
          fee_status?: string
          flight_date?: string
          flight_number?: string
          id?: string
          is_refundable?: boolean
          issue_type?: string
          jetclaim_fee_amount?: number | null
          reference?: string
          regulation_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regulations: {
        Row: {
          code: string
          created_at: string
          id: string
          max_compensation: string | null
          name: string
          region: string
          sort_order: number
          summary: string | null
          trigger_conditions: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          max_compensation?: string | null
          name: string
          region: string
          sort_order?: number
          summary?: string | null
          trigger_conditions?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          max_compensation?: string | null
          name?: string
          region?: string
          sort_order?: number
          summary?: string | null
          trigger_conditions?: string | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
