import type { Database } from "@/types/database.types";

export type ObservationSource = Database["public"]["Enums"]["observation_source"];
export type ObservationCategoryType = Database["public"]["Enums"]["observation_category_type"];
export type FormType = Database["public"]["Enums"]["form_type"];
export type RecommendationType = Database["public"]["Enums"]["recommendation_type"];

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
  technical_rating?: number | null;
  speed_rating?: number | null;
  motor_rating?: number | null;
  tactical_rating?: number | null;
  mental_rating?: number | null;
  motor_speed_rating?: number | null;
  motor_endurance_rating?: number | null;
  motor_jump_rating?: number | null;
  motor_agility_rating?: number | null;
  motor_acceleration_rating?: number | null;
  motor_strength_rating?: number | null;
  competition?: string | null;
  league?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  match_result?: string | null;
  positions?: string[] | null;
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
  team_role?: string | null;
  recommendations?: string | null;
  match_observation_id?: string | null;
  observation_category?: ObservationCategoryType | null;
  form_type?: FormType | null;
  match_performance_rating?: number | null;
  recommendation?: RecommendationType | null;
  summary?: string | null;
  mental_description?: string | null;
  motor_description?: string | null;
  raw_payload?: unknown | null;
  player?: {
    first_name: string;
    last_name: string;
    birth_year?: number;
    nationality?: string | null;
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
  technical_rating?: number | null;
  speed_rating?: number | null;
  motor_rating?: number | null;
  tactical_rating?: number | null;
  mental_rating?: number | null;
  motor_speed_rating?: number | null;
  motor_endurance_rating?: number | null;
  motor_jump_rating?: number | null;
  motor_agility_rating?: number | null;
  motor_acceleration_rating?: number | null;
  motor_strength_rating?: number | null;
  competition?: string | null;
  league?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  match_result?: string | null;
  positions?: string[] | null;
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
  team_role?: string | null;
  recommendations?: string | null;
  match_observation_id?: string | null;
  observation_category?: ObservationCategoryType | null;
  form_type?: FormType | null;
  match_performance_rating?: number | null;
  recommendation?: RecommendationType | null;
  summary?: string | null;
  mental_description?: string | null;
  motor_description?: string | null;
};

/** Match observation per-player form type (Akademia = full simplified fields, Senior = reduced). */
export type MatchFormType = "academy" | "senior";

/** One player slot in match observation flow (before save). */
export type MatchPlayerSlot = {
  id: string;
  player_id?: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  nationality?: string | null;
  /** Optional ISO date string (yyyy-MM-dd). */
  birth_date?: string | null;
  /** Optional ISO date string (yyyy-MM-dd). */
  contract_end_date?: string | null;
  club_name?: string;
  /** Body build (np. z słownika dict_body_build) */
  body_build?: string | null;
  /** Taktyczny schemat klubu zawodnika (formation) */
  club_formation?: string | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_email?: string | null;
  primary_position: string;
  overall_rating: number;
  match_performance_rating: number;
  recommendation: RecommendationType;
  summary: string;
  strengths?: string;
  weaknesses?: string;
  potential_now?: number;
  potential_future?: number;
  /** Academy: ratings 1–5 for section "4. Oceny ogólne". */
  technical_rating?: number;
  speed_rating?: number;
  motor_rating?: number;
  tactical_rating?: number;
  mental_rating?: number;
  /** Used when saving observation (academy | senior). */
  form_type?: MatchFormType;
};
