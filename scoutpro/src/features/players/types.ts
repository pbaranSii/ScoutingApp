import type { Database } from "@/types/database.types";

export type PipelineStatus = Database["public"]["Enums"]["pipeline_status"];
export type DominantFoot = Database["public"]["Enums"]["dominant_foot"];

export type Player = {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  club_id?: string | null;
  club?: { name: string } | null;
  region_id?: string | null;
  region?: { name: string } | null;
  primary_position?: string | null;
  secondary_positions?: string[] | null;
  dominant_foot?: DominantFoot | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  nationality?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_email?: string | null;
  photo_urls?: string[] | null;
  video_urls?: string[] | null;
  pipeline_status?: PipelineStatus | null;
  observation_count?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type PlayerInput = Partial<Player> & {
  first_name: string;
  last_name: string;
  birth_year: number;
};

export type PipelineHistoryEntry = {
  id: string;
  player_id: string;
  from_status?: string | null;
  to_status: string;
  reason?: string | null;
  changed_by: string;
  created_at: string;
  changed_by_user?: {
    full_name?: string | null;
  } | null;
};
