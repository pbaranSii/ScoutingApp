import type { Database } from "@/types/database.types";

export type ObservationSource = Database["public"]["Enums"]["observation_source"];

export type Observation = {
  id: string;
  player_id: string;
  scout_id?: string;
  source: ObservationSource;
  rank?: string | null;
  notes?: string | null;
  strengths?: string | null;
  strengths_notes?: string | null;
  weaknesses?: string | null;
  weaknesses_notes?: string | null;
  overall_rating?: number | null;
  competition?: string | null;
  photo_url?: string | null;
  potential_now?: number | null;
  potential_future?: number | null;
  observation_date?: string;
  created_at?: string;
  created_by?: string | null;
  created_by_name?: string | null;
  created_by_role?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  updated_by_name?: string | null;
  updated_by_role?: string | null;
  player?: {
    first_name: string;
    last_name: string;
    birth_year?: number;
    primary_position?: string | null;
    pipeline_status?: string | null;
    club?: { name: string } | null;
  } | null;
  scout?: {
    full_name?: string | null;
  } | null;
};

export type ObservationInput = {
  player_id: string;
  scout_id: string;
  source: ObservationSource;
  rank?: string | null;
  notes?: string | null;
  strengths?: string | null;
  strengths_notes?: string | null;
  weaknesses?: string | null;
  weaknesses_notes?: string | null;
  overall_rating?: number | null;
  competition?: string | null;
  photo_url?: string | null;
  potential_now?: number | null;
  potential_future?: number | null;
  observation_date: string;
  created_by?: string | null;
  created_by_name?: string | null;
  created_by_role?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
  updated_by_name?: string | null;
  updated_by_role?: string | null;
};
