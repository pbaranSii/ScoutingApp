export type Observation = {
  id: string;
  player_id: string;
  scout_id?: string;
  source: string;
  rank?: string | null;
  notes?: string | null;
  potential_now?: number | null;
  potential_future?: number | null;
  observation_date?: string;
  created_at?: string;
  player?: {
    first_name: string;
    last_name: string;
    birth_year?: number;
  } | null;
  scout?: {
    full_name?: string | null;
  } | null;
};

export type ObservationInput = {
  player_id: string;
  scout_id: string;
  source: string;
  rank?: string | null;
  notes?: string | null;
  potential_now?: number | null;
  potential_future?: number | null;
  observation_date: string;
};
