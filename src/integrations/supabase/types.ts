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
      appointments: {
        Row: {
          barbershop_id: string | null
          confirmation_code: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          end_at: string
          id: string
          notes: string | null
          professional_id: string
          service_duration_snapshot: number | null
          service_id: string
          service_name_snapshot: string | null
          service_price_snapshot: number | null
          source: string | null
          start_at: string
          status: string
          updated_at: string | null
          whatsapp_consent: boolean | null
          whatsapp_consent_at: string | null
        }
        Insert: {
          barbershop_id?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          end_at: string
          id?: string
          notes?: string | null
          professional_id: string
          service_duration_snapshot?: number | null
          service_id: string
          service_name_snapshot?: string | null
          service_price_snapshot?: number | null
          source?: string | null
          start_at: string
          status?: string
          updated_at?: string | null
          whatsapp_consent?: boolean | null
          whatsapp_consent_at?: string | null
        }
        Update: {
          barbershop_id?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          end_at?: string
          id?: string
          notes?: string | null
          professional_id?: string
          service_duration_snapshot?: number | null
          service_id?: string
          service_name_snapshot?: string | null
          service_price_snapshot?: number | null
          source?: string | null
          start_at?: string
          status?: string
          updated_at?: string | null
          whatsapp_consent?: boolean | null
          whatsapp_consent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_settings: {
        Row: {
          address: string | null
          barbershop_id: string | null
          booking_enabled: boolean | null
          business_name: string | null
          city: string | null
          created_at: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          phone: string | null
          slot_interval: number | null
          slug: string
          state: string | null
          timezone: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          barbershop_id?: string | null
          booking_enabled?: boolean | null
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slot_interval?: number | null
          slug: string
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          barbershop_id?: string | null
          booking_enabled?: boolean | null
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slot_interval?: number | null
          slug?: string
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_settings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_users: {
        Row: {
          active: boolean | null
          barbershop_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          barbershop_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          barbershop_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_users_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      business_breaks: {
        Row: {
          active: boolean | null
          barbershop_id: string | null
          created_at: string | null
          end_time: string
          id: string
          label: string | null
          start_time: string
          updated_at: string | null
          weekday: number
        }
        Insert: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          label?: string | null
          start_time: string
          updated_at?: string | null
          weekday: number
        }
        Update: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          label?: string | null
          start_time?: string
          updated_at?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_breaks_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          active: boolean | null
          barbershop_id: string | null
          close_time: string | null
          created_at: string | null
          id: string
          open_time: string | null
          updated_at: string | null
          weekday: number
        }
        Insert: {
          active?: boolean | null
          barbershop_id?: string | null
          close_time?: string | null
          created_at?: string | null
          id?: string
          open_time?: string | null
          updated_at?: string | null
          weekday: number
        }
        Update: {
          active?: boolean | null
          barbershop_id?: string | null
          close_time?: string | null
          created_at?: string | null
          id?: string
          open_time?: string | null
          updated_at?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          barbershop_id: string | null
          closed_at: string | null
          counted_closing_balance: number | null
          created_at: string | null
          difference: number | null
          expected_closing_balance: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_balance: number
          status: string
          updated_at: string | null
        }
        Insert: {
          barbershop_id?: string | null
          closed_at?: string | null
          counted_closing_balance?: number | null
          created_at?: string | null
          difference?: number | null
          expected_closing_balance?: number | null
          id?: string
          notes?: string | null
          opened_at: string
          opening_balance?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          barbershop_id?: string | null
          closed_at?: string | null
          counted_closing_balance?: number | null
          created_at?: string | null
          difference?: number | null
          expected_closing_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean | null
          barbershop_id: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          phone_normalized: string
          updated_at: string
          whatsapp_consent: boolean | null
          whatsapp_consent_at: string | null
        }
        Insert: {
          active?: boolean | null
          barbershop_id?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          phone_normalized: string
          updated_at?: string
          whatsapp_consent?: boolean | null
          whatsapp_consent_at?: string | null
        }
        Update: {
          active?: boolean | null
          barbershop_id?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          phone_normalized?: string
          updated_at?: string
          whatsapp_consent?: boolean | null
          whatsapp_consent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          barbershop_id: string | null
          category: string | null
          created_at: string | null
          customer_id: string | null
          description: string
          id: string
          notes: string | null
          occurred_at: string
          payment_id: string | null
          payment_method: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          barbershop_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_id?: string | null
          description: string
          id?: string
          notes?: string | null
          occurred_at: string
          payment_id?: string | null
          payment_method?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          barbershop_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          payment_id?: string | null
          payment_method?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          barbershop_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          barbershop_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          barbershop_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_blocks: {
        Row: {
          all_day: boolean | null
          barbershop_id: string | null
          created_at: string | null
          end_at: string
          id: string
          professional_id: string
          reason: string | null
          start_at: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          end_at: string
          id?: string
          professional_id: string
          reason?: string | null
          start_at: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          end_at?: string
          id?: string
          professional_id?: string
          reason?: string | null
          start_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_blocks_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_breaks: {
        Row: {
          active: boolean | null
          barbershop_id: string | null
          created_at: string | null
          end_time: string
          id: string
          label: string | null
          professional_id: string
          start_time: string
          updated_at: string | null
          weekday: number
        }
        Insert: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          label?: string | null
          professional_id: string
          start_time: string
          updated_at?: string | null
          weekday: number
        }
        Update: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          label?: string | null
          professional_id?: string
          start_time?: string
          updated_at?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_breaks_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_breaks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_schedules: {
        Row: {
          active: boolean | null
          barbershop_id: string | null
          created_at: string | null
          end_time: string
          id: string
          professional_id: string
          start_time: string
          updated_at: string | null
          weekday: number
        }
        Insert: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          professional_id: string
          start_time: string
          updated_at?: string | null
          weekday: number
        }
        Update: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          professional_id?: string
          start_time?: string
          updated_at?: string | null
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_schedules_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          active: boolean | null
          barbershop_id: string | null
          created_at: string | null
          id: string
          professional_id: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          id?: string
          professional_id: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          id?: string
          professional_id?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          barbershop_id: string | null
          bio: string | null
          created_at: string | null
          id: string
          instagram: string | null
          name: string
          phone: string | null
          sort_order: number | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          barbershop_id?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram?: string | null
          name: string
          phone?: string | null
          sort_order?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          barbershop_id?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram?: string | null
          name?: string
          phone?: string | null
          sort_order?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean | null
          barbershop_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          barbershop_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_logs: {
        Row: {
          appointment_id: string | null
          barbershop_id: string
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          id: string
          message_type: string
          phone_normalized: string
          provider_message_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          appointment_id?: string | null
          barbershop_id: string
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          id?: string
          message_type: string
          phone_normalized: string
          provider_message_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status: string
        }
        Update: {
          appointment_id?: string | null
          barbershop_id?: string
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          id?: string
          message_type?: string
          phone_normalized?: string
          provider_message_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_logs_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          access_token: string | null
          barbershop_id: string
          business_account_id: string | null
          cancellation_enabled: boolean | null
          confirmation_enabled: boolean | null
          connected_phone: string | null
          connection_status: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          instance_name: string | null
          language_code: string | null
          last_connected_at: string | null
          phone_number_id: string | null
          provider: string | null
          reminder_enabled: boolean | null
          reminder_minutes: number | null
          reschedule_enabled: boolean | null
          template_confirmation_name: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          barbershop_id: string
          business_account_id?: string | null
          cancellation_enabled?: boolean | null
          confirmation_enabled?: boolean | null
          connected_phone?: string | null
          connection_status?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          instance_name?: string | null
          language_code?: string | null
          last_connected_at?: string | null
          phone_number_id?: string | null
          provider?: string | null
          reminder_enabled?: boolean | null
          reminder_minutes?: number | null
          reschedule_enabled?: boolean | null
          template_confirmation_name?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          barbershop_id?: string
          business_account_id?: string | null
          cancellation_enabled?: boolean | null
          confirmation_enabled?: boolean | null
          connected_phone?: string | null
          connection_status?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          instance_name?: string | null
          language_code?: string | null
          last_connected_at?: string | null
          phone_number_id?: string | null
          provider?: string | null
          reminder_enabled?: boolean | null
          reminder_minutes?: number | null
          reschedule_enabled?: boolean | null
          template_confirmation_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_barbershop_member: {
        Args: { _barbershop_id: string }
        Returns: boolean
      }
      check_user_membership: { Args: { _user_id: string }; Returns: boolean }
      create_admin_appointment: {
        Args: {
          p_barbershop_id: string
          p_customer_name: string
          p_customer_phone: string
          p_customer_phone_normalized: string
          p_end_at: string
          p_notes: string
          p_professional_id: string
          p_service_duration_snapshot: number
          p_service_id: string
          p_service_name_snapshot: string
          p_service_price_snapshot: number
          p_start_at: string
        }
        Returns: string
      }
      create_barbershop_onboarding: {
        Args: {
          p_address?: string
          p_business_hours?: Json
          p_city?: string
          p_instagram?: string
          p_logo_url: string
          p_name: string
          p_slug: string
          p_state?: string
          p_timezone?: string
          p_user_id: string
          p_whatsapp?: string
        }
        Returns: string
      }
      create_public_appointment: {
        Args: {
          p_barbershop_id?: string
          p_customer_name: string
          p_customer_phone: string
          p_notes?: string
          p_professional_id: string
          p_service_id: string
          p_start_at: string
          p_whatsapp_consent?: boolean
          p_whatsapp_consent_at?: string
        }
        Returns: Json
      }
      generate_confirmation_code: { Args: never; Returns: string }
      get_busy_slots:
        | {
            Args: { p_date: string }
            Returns: {
              end_at: string
              professional_id: string
              start_at: string
            }[]
          }
        | {
            Args: { p_barbershop_id?: string; p_date: string }
            Returns: {
              barbershop_id: string
              end_at: string
              professional_id: string
              start_at: string
            }[]
          }
      get_or_create_customer: {
        Args: {
          p_barbershop_id: string
          p_name: string
          p_phone: string
          p_phone_normalized: string
        }
        Returns: string
      }
      get_public_busy_slots: {
        Args: {
          p_barbershop_id: string
          p_end: string
          p_professional_id: string
          p_start: string
        }
        Returns: {
          end_at: string
          id: string
          professional_id: string
          start_at: string
          status: string
        }[]
      }
      register_appointment_payment: {
        Args: {
          p_amount: number
          p_appointment_id: string
          p_notes?: string
          p_payment_method: string
          p_status: string
        }
        Returns: Json
      }
      user_has_barbershop_access: {
        Args: { _barbershop_id: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
