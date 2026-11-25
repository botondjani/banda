// Generálva a Supabase sémából (MCP generate_typescript_types). Kézzel ne szerkeszd.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      activity: {
        Row: {
          actor_id: string
          created_at: string
          group_id: string
          id: string
          module_id: string
          payload: Json
          ref_id: string | null
          type: string
        }
        Insert: {
          actor_id?: string
          created_at?: string
          group_id: string
          id?: string
          module_id?: string
          payload?: Json
          ref_id?: string | null
          type: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          group_id?: string
          id?: string
          module_id?: string
          payload?: Json
          ref_id?: string | null
          type?: string
        }
        Relationships: [
          { foreignKeyName: 'activity_actor_id_fkey'; columns: ['actor_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'activity_group_id_fkey'; columns: ['group_id']; isOneToOne: false; referencedRelation: 'groups'; referencedColumns: ['id'] },
        ]
      }
      availability_pings: {
        Row: { created_at: string; group_id: string; id: string; note: string | null; program_id: string | null; tag: string; until: string; user_id: string }
        Insert: { created_at?: string; group_id: string; id?: string; note?: string | null; program_id?: string | null; tag: string; until: string; user_id?: string }
        Update: { created_at?: string; group_id?: string; id?: string; note?: string | null; program_id?: string | null; tag?: string; until?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'availability_pings_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      bring_items: {
        Row: { claimed_by: string | null; created_at: string; created_by: string; done: boolean; group_id: string; id: string; kind: string; name: string; program_id: string; qty: string | null }
        Insert: { claimed_by?: string | null; created_at?: string; created_by?: string; done?: boolean; group_id: string; id?: string; kind: string; name: string; program_id: string; qty?: string | null }
        Update: { claimed_by?: string | null; created_at?: string; created_by?: string; done?: boolean; group_id?: string; id?: string; kind?: string; name?: string; program_id?: string; qty?: string | null }
        Relationships: [
          { foreignKeyName: 'bring_items_claimed_by_fkey'; columns: ['claimed_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'bring_items_created_by_fkey'; columns: ['created_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      comments: {
        Row: { activity_id: string; body: string; created_at: string; id: string; user_id: string }
        Insert: { activity_id: string; body: string; created_at?: string; id?: string; user_id?: string }
        Update: { activity_id?: string; body?: string; created_at?: string; id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'comments_activity_id_fkey'; columns: ['activity_id']; isOneToOne: false; referencedRelation: 'activity'; referencedColumns: ['id'] },
          { foreignKeyName: 'comments_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      draws: {
        Row: { created_at: string; created_by: string; group_id: string; id: string; kind: string; options: Json; result: Json }
        Insert: { created_at?: string; created_by?: string; group_id: string; id?: string; kind: string; options?: Json; result: Json }
        Update: { created_at?: string; created_by?: string; group_id?: string; id?: string; kind?: string; options?: Json; result?: Json }
        Relationships: [
          { foreignKeyName: 'draws_created_by_fkey'; columns: ['created_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      expense_splits: {
        Row: { amount: number; expense_id: string; user_id: string }
        Insert: { amount: number; expense_id: string; user_id: string }
        Update: { amount?: number; expense_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'expense_splits_expense_id_fkey'; columns: ['expense_id']; isOneToOne: false; referencedRelation: 'expenses'; referencedColumns: ['id'] },
          { foreignKeyName: 'expense_splits_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      expenses: {
        Row: { amount: number; created_at: string; created_by: string; currency: string; group_id: string; id: string; paid_by: string; program_id: string | null; split_mode: string; title: string }
        Insert: { amount: number; created_at?: string; created_by?: string; currency?: string; group_id: string; id?: string; paid_by: string; program_id?: string | null; split_mode: string; title: string }
        Update: { amount?: number; created_at?: string; created_by?: string; currency?: string; group_id?: string; id?: string; paid_by?: string; program_id?: string | null; split_mode?: string; title?: string }
        Relationships: [
          { foreignKeyName: 'expenses_paid_by_fkey'; columns: ['paid_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'expenses_created_by_fkey'; columns: ['created_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'expenses_program_id_fkey'; columns: ['program_id']; isOneToOne: false; referencedRelation: 'programs'; referencedColumns: ['id'] },
        ]
      }
      free_days: {
        Row: { day: string; group_id: string; state: string; user_id: string }
        Insert: { day: string; group_id: string; state: string; user_id?: string }
        Update: { day?: string; group_id?: string; state?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'free_days_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      group_members: {
        Row: { group_id: string; joined_at: string; role: string; user_id: string }
        Insert: { group_id: string; joined_at?: string; role?: string; user_id: string }
        Update: { group_id?: string; joined_at?: string; role?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'group_members_group_id_fkey'; columns: ['group_id']; isOneToOne: false; referencedRelation: 'groups'; referencedColumns: ['id'] },
          { foreignKeyName: 'group_members_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      group_modules: {
        Row: { enabled: boolean; group_id: string; module_id: string; settings: Json }
        Insert: { enabled?: boolean; group_id: string; module_id: string; settings?: Json }
        Update: { enabled?: boolean; group_id?: string; module_id?: string; settings?: Json }
        Relationships: [
          { foreignKeyName: 'group_modules_group_id_fkey'; columns: ['group_id']; isOneToOne: false; referencedRelation: 'groups'; referencedColumns: ['id'] },
        ]
      }
      groups: {
        Row: { created_at: string; created_by: string; id: string; invite_code: string; name: string }
        Insert: { created_at?: string; created_by?: string; id?: string; invite_code?: string; name: string }
        Update: { created_at?: string; created_by?: string; id?: string; invite_code?: string; name?: string }
        Relationships: [
          { foreignKeyName: 'groups_created_by_fkey'; columns: ['created_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      list_items: {
        Row: { added_by: string; created_at: string; group_id: string; id: string; list_id: string; meta: Json; note: string | null; title: string; url: string | null }
        Insert: { added_by?: string; created_at?: string; group_id: string; id?: string; list_id: string; meta?: Json; note?: string | null; title: string; url?: string | null }
        Update: { added_by?: string; created_at?: string; group_id?: string; id?: string; list_id?: string; meta?: Json; note?: string | null; title?: string; url?: string | null }
        Relationships: [
          { foreignKeyName: 'list_items_list_id_fkey'; columns: ['list_id']; isOneToOne: false; referencedRelation: 'lists'; referencedColumns: ['id'] },
          { foreignKeyName: 'list_items_added_by_fkey'; columns: ['added_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      list_marks: {
        Row: { created_at: string; group_id: string; item_id: string; rating: number | null; user_id: string }
        Insert: { created_at?: string; group_id: string; item_id: string; rating?: number | null; user_id?: string }
        Update: { created_at?: string; group_id?: string; item_id?: string; rating?: number | null; user_id?: string }
        Relationships: [
          { foreignKeyName: 'list_marks_item_id_fkey'; columns: ['item_id']; isOneToOne: false; referencedRelation: 'list_items'; referencedColumns: ['id'] },
          { foreignKeyName: 'list_marks_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      lists: {
        Row: { created_at: string; created_by: string | null; group_id: string; id: string; kind: string; preset_key: string | null; title: string }
        Insert: { created_at?: string; created_by?: string | null; group_id: string; id?: string; kind?: string; preset_key?: string | null; title: string }
        Update: { created_at?: string; created_by?: string | null; group_id?: string; id?: string; kind?: string; preset_key?: string | null; title?: string }
        Relationships: []
      }
      notification_prefs: {
        Row: { enabled: boolean; type: string; user_id: string }
        Insert: { enabled: boolean; type: string; user_id?: string }
        Update: { enabled?: boolean; type?: string; user_id?: string }
        Relationships: []
      }
      notifications: {
        Row: { created_at: string; group_id: string; id: string; payload: Json; pushed_at: string | null; read_at: string | null; type: string; user_id: string }
        Insert: { created_at?: string; group_id: string; id?: string; payload?: Json; pushed_at?: string | null; read_at?: string | null; type: string; user_id: string }
        Update: { created_at?: string; group_id?: string; id?: string; payload?: Json; pushed_at?: string | null; read_at?: string | null; type?: string; user_id?: string }
        Relationships: []
      }
      push_subscriptions: {
        Row: { auth: string; created_at: string; endpoint: string; p256dh: string; user_id: string }
        Insert: { auth: string; created_at?: string; endpoint: string; p256dh: string; user_id: string }
        Update: { auth?: string; created_at?: string; endpoint?: string; p256dh?: string; user_id?: string }
        Relationships: []
      }
      ping_joins: {
        Row: { created_at: string; ping_id: string; user_id: string }
        Insert: { created_at?: string; ping_id: string; user_id: string }
        Update: { created_at?: string; ping_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'ping_joins_ping_id_fkey'; columns: ['ping_id']; isOneToOne: false; referencedRelation: 'availability_pings'; referencedColumns: ['id'] },
          { foreignKeyName: 'ping_joins_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      profiles: {
        Row: { avatar_url: string | null; color: number; created_at: string; display_name: string; id: string }
        Insert: { avatar_url?: string | null; color?: number; created_at?: string; display_name: string; id: string }
        Update: { avatar_url?: string | null; color?: number; created_at?: string; display_name?: string; id?: string }
        Relationships: []
      }
      program_attendees: {
        Row: { program_id: string; status: string; user_id: string }
        Insert: { program_id: string; status: string; user_id?: string }
        Update: { program_id?: string; status?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'program_attendees_program_id_fkey'; columns: ['program_id']; isOneToOne: false; referencedRelation: 'programs'; referencedColumns: ['id'] },
          { foreignKeyName: 'program_attendees_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      programs: {
        Row: {
          created_at: string
          created_by: string
          ends_at: string | null
          group_id: string
          id: string
          location: string | null
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          ends_at?: string | null
          group_id: string
          id?: string
          location?: string | null
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ends_at?: string | null
          group_id?: string
          id?: string
          location?: string | null
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          { foreignKeyName: 'programs_created_by_fkey'; columns: ['created_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'programs_group_id_fkey'; columns: ['group_id']; isOneToOne: false; referencedRelation: 'groups'; referencedColumns: ['id'] },
        ]
      }
      settlements: {
        Row: { amount: number; created_at: string; created_by: string; from_user: string; group_id: string; id: string; to_user: string }
        Insert: { amount: number; created_at?: string; created_by?: string; from_user: string; group_id: string; id?: string; to_user: string }
        Update: { amount?: number; created_at?: string; created_by?: string; from_user?: string; group_id?: string; id?: string; to_user?: string }
        Relationships: []
      }
      reactions: {
        Row: { activity_id: string; emoji: string; user_id: string }
        Insert: { activity_id: string; emoji: string; user_id?: string }
        Update: { activity_id?: string; emoji?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'reactions_activity_id_fkey'; columns: ['activity_id']; isOneToOne: false; referencedRelation: 'activity'; referencedColumns: ['id'] },
          { foreignKeyName: 'reactions_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
    }
    Views: {
      balances: {
        Row: { balance: number; group_id: string; user_id: string }
        Relationships: []
      }
    }
    Functions: {
      activity_group: { Args: { aid: string }; Returns: string }
      add_expense: {
        Args: { amount: number; gid: string; mode: string; paid_by: string; parts: Json; program?: string | null; title: string }
        Returns: string
      }
      create_group: { Args: { group_name: string }; Returns: string }
      draw: { Args: { gid: string; kind: string; options?: Json }; Returns: string }
      is_group_member: { Args: { gid: string }; Returns: boolean }
      is_group_owner: { Args: { gid: string }; Returns: boolean }
      join_group: { Args: { code: string }; Returns: string }
      join_ping: { Args: { pid: string }; Returns: string }
      program_group: { Args: { pid: string }; Returns: string }
      reset_invite_code: { Args: { gid: string }; Returns: string }
      save_push_subscription: { Args: { auth: string; endpoint: string; p256dh: string }; Returns: undefined }
      settle_plan: { Args: { gid: string }; Returns: { amount: number; from_user: string; to_user: string }[] }
      shares_group: { Args: { uid: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
