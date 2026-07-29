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
      app_state: {
        Row: {
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      auth_otp_attempts: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          kind: string
          phone: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          kind: string
          phone?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          kind?: string
          phone?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          amount_cents: number | null
          currency: string | null
          environment: string
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          paddle_subscription_id: string | null
          price_id: string | null
          product_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          currency?: string | null
          environment?: string
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          paddle_subscription_id?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          currency?: string | null
          environment?: string
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          paddle_subscription_id?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      knit_tester_feedback: {
        Row: {
          atual: number
          autor: string
          concluido: boolean
          consumo_real_g: number | null
          created_at: string
          id: string
          link_id: string
          notas: Json
          tamanho_usado: string | null
          token: string
          total_rows: number
          updated_at: string
        }
        Insert: {
          atual?: number
          autor?: string
          concluido?: boolean
          consumo_real_g?: number | null
          created_at?: string
          id?: string
          link_id: string
          notas?: Json
          tamanho_usado?: string | null
          token: string
          total_rows?: number
          updated_at?: string
        }
        Update: {
          atual?: number
          autor?: string
          concluido?: boolean
          consumo_real_g?: number | null
          created_at?: string
          id?: string
          link_id?: string
          notas?: Json
          tamanho_usado?: string | null
          token?: string
          total_rows?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knit_tester_feedback_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "knit_tester_links"
            referencedColumns: ["id"]
          },
        ]
      }
      knit_tester_links: {
        Row: {
          created_at: string
          id: string
          titulo: string | null
          token: string
          total_rows: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          titulo?: string | null
          token: string
          total_rows?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          titulo?: string | null
          token?: string
          total_rows?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paddle_webhook_events: {
        Row: {
          environment: string
          event_id: string
          event_type: string | null
          processed_at: string
        }
        Insert: {
          environment: string
          event_id: string
          event_type?: string | null
          processed_at?: string
        }
        Update: {
          environment?: string
          event_id?: string
          event_type?: string | null
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          birth_date: string | null
          company: string | null
          country: string | null
          created_at: string
          first_name: string | null
          last_2fa_at: string | null
          last_name: string | null
          marketing_opt_in: boolean
          nationality: string | null
          onboarding_concluido: boolean
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          preferred_currency: string
          privacy_accepted_at: string | null
          subscription_status: Database["public"]["Enums"]["subscription_plan"]
          subscription_trial_ends: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          birth_date?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          last_2fa_at?: string | null
          last_name?: string | null
          marketing_opt_in?: boolean
          nationality?: string | null
          onboarding_concluido?: boolean
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          preferred_currency?: string
          privacy_accepted_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_plan"]
          subscription_trial_ends?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          birth_date?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          last_2fa_at?: string | null
          last_name?: string | null
          marketing_opt_in?: boolean
          nationality?: string | null
          onboarding_concluido?: boolean
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          preferred_currency?: string
          privacy_accepted_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_plan"]
          subscription_trial_ends?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_percent: number
          expires_at: string | null
          id: string
          is_lifetime: boolean
          max_redemptions: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_lifetime?: boolean
          max_redemptions?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_lifetime?: boolean
          max_redemptions?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          code: string
          discount_percent: number
          id: string
          is_lifetime: boolean
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          code: string
          discount_percent?: number
          id?: string
          is_lifetime?: boolean
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          code?: string
          discount_percent?: number
          id?: string
          is_lifetime?: boolean
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          accounted_at: string | null
          amount_cents: number
          confirmed_at: string | null
          created_at: string
          currency: string
          environment: string
          id: string
          kind: string
          metadata: Json
          paddle_adjustment_id: string | null
          paddle_subscription_id: string | null
          paddle_transaction_id: string | null
          reason_code: string
          reason_note: string | null
          requested_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accounted_at?: string | null
          amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          kind: string
          metadata?: Json
          paddle_adjustment_id?: string | null
          paddle_subscription_id?: string | null
          paddle_transaction_id?: string | null
          reason_code: string
          reason_note?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accounted_at?: string | null
          amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          kind?: string
          metadata?: Json
          paddle_adjustment_id?: string | null
          paddle_subscription_id?: string | null
          paddle_transaction_id?: string | null
          reason_code?: string
          reason_note?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          path: string | null
          reason: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          path?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      webhook_events: {
        Row: {
          external_id: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
          user_id: string
        }
        Insert: {
          external_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          received_at?: string
          user_id: string
        }
        Update: {
          external_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_tenant_map: {
        Row: {
          created_at: string
          id: string
          provider: string
          tenant_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider: string
          tenant_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          tenant_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_subscription: { Args: never; Returns: Json }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_2fa_completed: { Args: never; Returns: Json }
      mark_phone_verified: { Args: { _phone: string }; Returns: Json }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reconcile_expired_access: { Args: never; Returns: number }
      redeem_promo_code: { Args: { _code: string }; Returns: Json }
      refunded_cents_for_transaction: {
        Args: { _env: string; _txn_id: string }
        Returns: number
      }
      reset_phone_verification: { Args: never; Returns: Json }
      start_subscription_trial: {
        Args: { _cycle?: string; _plan: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      billing_cycle: "mensal" | "anual"
      subscription_plan: "light" | "base" | "premium" | "premium_vitalicio"
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
      billing_cycle: ["mensal", "anual"],
      subscription_plan: ["light", "base", "premium", "premium_vitalicio"],
    },
  },
} as const
