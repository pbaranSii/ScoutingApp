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
      categories: {
        Row: {
          created_at: string
          id: string
          max_birth_year: number | null
          min_birth_year: number | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_birth_year?: number | null
          min_birth_year?: number | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          max_birth_year?: number | null
          min_birth_year?: number | null
          name?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          region_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          region_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          region_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          created_at: string
          id: string
          name: string
          position_id: string
          sort_order: number
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position_id: string
          sort_order?: number
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position_id?: string
          sort_order?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_criteria_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          level: number | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number | null
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string
          id: string
          league_id: string | null
          location: string | null
          match_date: string
          notes: string | null
          score_away: number | null
          score_home: number | null
          team_away: string
          team_home: string
          type: Database["public"]["Enums"]["match_type"]
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          league_id?: string | null
          location?: string | null
          match_date: string
          notes?: string | null
          score_away?: number | null
          score_home?: number | null
          team_away: string
          team_home: string
          type?: Database["public"]["Enums"]["match_type"]
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          league_id?: string | null
          location?: string | null
          match_date?: string
          notes?: string | null
          score_away?: number | null
          score_home?: number | null
          team_away?: string
          team_home?: string
          type?: Database["public"]["Enums"]["match_type"]
        }
        Relationships: [
          {
            foreignKeyName: "matches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          competition: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          created_by_role: string | null
          id: string
          is_offline_created: boolean
          location: string | null
          match_id: string | null
          match_result: string | null
          mental_rating: number | null
          motor_rating: number | null
          notes: string | null
          observation_date: string
          positions: string[] | null
          player_id: string
          photo_url: string | null
          potential_future: number | null
          potential_now: number | null
          rank: string | null
          recommendations: string | null
          scout_id: string
          source: Database["public"]["Enums"]["observation_source"]
          speed_rating: number | null
          status: string
          strengths: string | null
          strengths_notes: string | null
          tactical_rating: number | null
          technical_rating: number | null
          team_role: string | null
          weaknesses: string | null
          weaknesses_notes: string | null
          overall_rating: number | null
          updated_at: string | null
          updated_by: string | null
          updated_by_name: string | null
          updated_by_role: string | null
          synced_at: string | null
        }
        Insert: {
          competition?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          id?: string
          is_offline_created?: boolean
          location?: string | null
          match_id?: string | null
          match_result?: string | null
          mental_rating?: number | null
          motor_rating?: number | null
          notes?: string | null
          observation_date?: string
          positions?: string[] | null
          player_id: string
          photo_url?: string | null
          potential_future?: number | null
          potential_now?: number | null
          rank?: string | null
          recommendations?: string | null
          scout_id: string
          source?: Database["public"]["Enums"]["observation_source"]
          speed_rating?: number | null
          status?: string
          strengths?: string | null
          strengths_notes?: string | null
          tactical_rating?: number | null
          technical_rating?: number | null
          team_role?: string | null
          weaknesses?: string | null
          weaknesses_notes?: string | null
          overall_rating?: number | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
          updated_by_role?: string | null
          synced_at?: string | null
        }
        Update: {
          competition?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          created_by_role?: string | null
          id?: string
          is_offline_created?: boolean
          location?: string | null
          match_id?: string | null
          match_result?: string | null
          mental_rating?: number | null
          motor_rating?: number | null
          notes?: string | null
          observation_date?: string
          positions?: string[] | null
          player_id?: string
          photo_url?: string | null
          potential_future?: number | null
          potential_now?: number | null
          rank?: string | null
          recommendations?: string | null
          scout_id?: string
          source?: Database["public"]["Enums"]["observation_source"]
          speed_rating?: number | null
          status?: string
          strengths?: string | null
          strengths_notes?: string | null
          tactical_rating?: number | null
          technical_rating?: number | null
          team_role?: string | null
          weaknesses?: string | null
          weaknesses_notes?: string | null
          overall_rating?: number | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
          updated_by_role?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_scout_id_fkey"
            columns: ["scout_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      multimedia: {
        Row: {
          id: string
          player_id: string
          observation_id: string | null
          file_name: string
          file_type: Database["public"]["Enums"]["multimedia_file_type"]
          file_size: number | null
          file_format: string | null
          storage_path: string | null
          youtube_url: string | null
          youtube_video_id: string | null
          youtube_title: string | null
          youtube_thumbnail_url: string | null
          youtube_duration_seconds: number | null
          created_by: string
          created_at: string
          updated_at: string
          sync_status: Database["public"]["Enums"]["sync_status"]
          sync_error_message: string | null
        }
        Insert: {
          id?: string
          player_id: string
          observation_id?: string | null
          file_name?: string
          file_type: Database["public"]["Enums"]["multimedia_file_type"]
          file_size?: number | null
          file_format?: string | null
          storage_path?: string | null
          youtube_url?: string | null
          youtube_video_id?: string | null
          youtube_title?: string | null
          youtube_thumbnail_url?: string | null
          youtube_duration_seconds?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
          sync_status?: Database["public"]["Enums"]["sync_status"]
          sync_error_message?: string | null
        }
        Update: {
          id?: string
          player_id?: string
          observation_id?: string | null
          file_name?: string
          file_type?: Database["public"]["Enums"]["multimedia_file_type"]
          file_size?: number | null
          file_format?: string | null
          storage_path?: string | null
          youtube_url?: string | null
          youtube_video_id?: string | null
          youtube_title?: string | null
          youtube_thumbnail_url?: string | null
          youtube_duration_seconds?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
          sync_status?: Database["public"]["Enums"]["sync_status"]
          sync_error_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multimedia_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multimedia_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multimedia_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_queue: {
        Row: {
          action_type: string
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          sync_status: Database["public"]["Enums"]["sync_status"]
          synced_at: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload: Json
          sync_status?: Database["public"]["Enums"]["sync_status"]
          synced_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          sync_status?: Database["public"]["Enums"]["sync_status"]
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_history: {
        Row: {
          changed_by: string
          created_at: string
          from_status: string | null
          id: string
          player_id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_status?: string | null
          id?: string
          player_id: string
          reason?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_status?: string | null
          id?: string
          player_id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_contacts: {
        Row: {
          contact_name: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          notes: string | null
          phone: string | null
          player_id: string
        }
        Insert: {
          contact_name?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          notes?: string | null
          phone?: string | null
          player_id: string
        }
        Update: {
          contact_name?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          notes?: string | null
          phone?: string | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_contacts_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_evaluations: {
        Row: {
          created_at: string
          criteria_id: string
          id: string
          observation_id: string
          score: number
        }
        Insert: {
          created_at?: string
          criteria_id: string
          id?: string
          observation_id: string
          score: number
        }
        Update: {
          created_at?: string
          criteria_id?: string
          id?: string
          observation_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_evaluations_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_evaluations_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birth_date: string | null
          birth_year: number
          club_id: string | null
          created_at: string
          decision_notes: string | null
          decision_status: string | null
          dominant_foot: Database["public"]["Enums"]["dominant_foot"] | null
          first_name: string
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          height_cm: number | null
          id: string
          last_name: string
          nationality: string | null
          photo_urls: string[] | null
          pipeline_status: Database["public"]["Enums"]["pipeline_status"]
          primary_position: string | null
          region_id: string | null
          secondary_positions: string[] | null
          updated_at: string
          video_urls: string[] | null
          weight_kg: number | null
        }
        Insert: {
          birth_date?: string | null
          birth_year: number
          club_id?: string | null
          created_at?: string
          decision_notes?: string | null
          decision_status?: string | null
          dominant_foot?: Database["public"]["Enums"]["dominant_foot"] | null
          first_name: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          height_cm?: number | null
          id?: string
          last_name: string
          nationality?: string | null
          photo_urls?: string[] | null
          pipeline_status?: Database["public"]["Enums"]["pipeline_status"]
          primary_position?: string | null
          region_id?: string | null
          secondary_positions?: string[] | null
          updated_at?: string
          video_urls?: string[] | null
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string | null
          birth_year?: number
          club_id?: string | null
          created_at?: string
          decision_notes?: string | null
          decision_status?: string | null
          dominant_foot?: Database["public"]["Enums"]["dominant_foot"] | null
          first_name?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          height_cm?: number | null
          id?: string
          last_name?: string
          nationality?: string | null
          photo_urls?: string[] | null
          pipeline_status?: Database["public"]["Enums"]["pipeline_status"]
          primary_position?: string | null
          region_id?: string | null
          secondary_positions?: string[] | null
          updated_at?: string
          video_urls?: string[] | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      dict_preferred_foot: {
        Row: {
          id: string
          foot_code: string
          name_pl: string
          name_en: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          foot_code: string
          name_pl: string
          name_en: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          foot_code?: string
          name_pl?: string
          name_en?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      dict_player_sources: {
        Row: {
          id: string
          source_code: string
          name_pl: string
          name_en: string
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source_code: string
          name_pl: string
          name_en: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source_code?: string
          name_pl?: string
          name_en?: string
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      dict_recruitment_decisions: {
        Row: {
          id: string
          decision_code: string
          name_pl: string
          name_en: string
          decision_category: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          decision_code: string
          name_pl: string
          name_en: string
          decision_category?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          decision_code?: string
          name_pl?: string
          name_en?: string
          decision_category?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      dict_team_roles: {
        Row: {
          id: string
          code: string
          name_pl: string
          name_en: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name_pl: string
          name_en: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name_pl?: string
          name_en?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      dict_strengths: {
        Row: {
          id: string
          code: string
          name_pl: string
          name_en: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name_pl: string
          name_en: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name_pl?: string
          name_en?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      dict_weaknesses: {
        Row: {
          id: string
          code: string
          name_pl: string
          name_en: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name_pl: string
          name_en: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name_pl?: string
          name_en?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          name: string
          display_order: number
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          display_order?: number
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          display_order?: number
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          display_order: number
          code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          display_order?: number
          code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          display_order?: number
          code?: string | null
        }
        Relationships: []
      }
      task_players: {
        Row: {
          id: string
          task_id: string
          player_id: string
        }
        Insert: {
          id?: string
          task_id: string
          player_id: string
        }
        Update: {
          id?: string
          task_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_players_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          type: Database["public"]["Enums"]["task_type"]
          description: string
          assigned_to: string | null
          deadline: string
          created_by: string
          created_at: string
          updated_at: string
          status: Database["public"]["Enums"]["task_status"]
          location: string | null
          meeting_date: string | null
          inviter_info: string | null
          observation_location: string | null
          observation_date: string | null
          observation_source: string | null
        }
        Insert: {
          id?: string
          type: Database["public"]["Enums"]["task_type"]
          description: string
          assigned_to?: string | null
          deadline: string
          created_by: string
          created_at?: string
          updated_at?: string
          status?: Database["public"]["Enums"]["task_status"]
          location?: string | null
          meeting_date?: string | null
          inviter_info?: string | null
          observation_location?: string | null
          observation_date?: string | null
          observation_source?: string | null
        }
        Update: {
          id?: string
          type?: Database["public"]["Enums"]["task_type"]
          description?: string
          assigned_to?: string | null
          deadline?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          status?: Database["public"]["Enums"]["task_status"]
          location?: string | null
          meeting_date?: string | null
          inviter_info?: string | null
          observation_location?: string | null
          observation_date?: string | null
          observation_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          business_role: Database["public"]["Enums"]["user_business_role"]
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          business_role?: Database["public"]["Enums"]["user_business_role"]
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          business_role?: Database["public"]["Enums"]["user_business_role"]
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contact_type: "parent" | "guardian" | "agent" | "other"
      dominant_foot: "left" | "right" | "both"
      match_type: "live" | "video"
      multimedia_file_type: "image" | "video" | "youtube_link"
      observation_source:
        | "scouting"
        | "referral"
        | "application"
        | "trainer_report"
        | "scout_report"
        | "video_analysis"
        | "tournament"
        | "training_camp"
      pipeline_status:
        | "unassigned"
        | "observed"
        | "shortlist"
        | "trial"
        | "offer"
        | "signed"
        | "rejected"
      sync_status: "pending" | "synced" | "failed"
      task_status: "pending" | "completed" | "cancelled"
      task_type: "task" | "invitation" | "observation"
      user_business_role: "scout" | "coach" | "director" | "suspended" | "admin"
      user_role: "admin" | "user"
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
      contact_type: ["parent", "guardian", "agent", "other"],
      dominant_foot: ["left", "right", "both"],
      match_type: ["live", "video"],
      multimedia_file_type: ["image", "video", "youtube_link"],
      observation_source: [
        "scouting",
        "referral",
        "application",
        "trainer_report",
        "scout_report",
        "video_analysis",
        "tournament",
        "training_camp",
      ],
      pipeline_status: [
        "unassigned",
        "observed",
        "shortlist",
        "trial",
        "offer",
        "signed",
        "rejected",
      ],
      sync_status: ["pending", "synced", "failed"],
      task_status: ["pending", "completed", "cancelled"],
      task_type: ["task", "invitation", "observation"],
      user_role: ["admin", "user"],
    },
  },
} as const
