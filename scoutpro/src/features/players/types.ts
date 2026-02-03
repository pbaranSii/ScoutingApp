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
  dominant_foot?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  nationality?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_email?: string | null;
  pipeline_status?: string | null;
  observation_count?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type PlayerInput = Partial<Player> & {
  first_name: string;
  last_name: string;
  birth_year: number;
};
