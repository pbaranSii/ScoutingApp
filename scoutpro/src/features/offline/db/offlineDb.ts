import Dexie from "dexie";
import type { Table } from "dexie";
import type { ObservationSource } from "@/features/observations/types";

export type OfflineObservation = {
  localId: string;
  remoteId?: string;
  data: {
    player_id?: string;
    scout_id?: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    club_name?: string;
    primary_position?: string;
    should_update_player?: boolean;
    source: ObservationSource;
    rank?: string;
    notes?: string;
    strengths?: string;
    strengths_notes?: string;
    weaknesses?: string;
    weaknesses_notes?: string;
    overall_rating?: number;
    technical_rating?: number;
    speed_rating?: number;
    motor_rating?: number;
    motor_speed_rating?: number;
    motor_endurance_rating?: number;
    motor_jump_rating?: number;
    motor_agility_rating?: number;
    motor_acceleration_rating?: number;
    motor_strength_rating?: number;
    motor_description?: string;
    tactical_rating?: number;
    mental_rating?: number;
    competition?: string;
    league?: string | null;
    home_team?: string;
    away_team?: string;
    match_result?: string;
    location?: string;
    positions?: string[];
    photo_url?: string;
    potential_now?: number;
    potential_future?: number;
    observation_date: string;
    team_role?: string;
    recommendations?: string;
    summary?: string;
    recommendation?: "positive" | "to_observe" | "negative";
    form_type?: "simplified" | "extended" | "academy" | "senior";
    match_performance_rating?: number;
    match_observation_id?: string | null;
    observation_category?: "match_player" | "individual";
    mental_description?: string | null;
    created_by?: string;
    created_by_name?: string;
    created_by_role?: string;
    updated_by?: string;
    updated_by_name?: string;
    updated_by_role?: string;
    updated_at?: string;
  };
  createdAt: Date;
  syncStatus: "pending" | "syncing" | "synced" | "failed";
  syncAttempts: number;
  syncError?: string;
  lastSyncAttempt?: Date;
};

export type CachedPlayer = {
  id: string;
  data: object;
  cachedAt: Date;
};

export type CachedObservation = {
  id: string;
  data: object;
  cachedAt: Date;
};

/** Header payload for match observation (matches MatchObservationInput). */
export type OfflineMatchHeader = {
  observation_date: string;
  competition: string;
  league?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  match_result?: string | null;
  location?: string | null;
  source: string;
  scout_id: string;
  home_team_formation?: string | null;
  away_team_formation?: string | null;
  match_notes?: string | null;
  created_by?: string;
  created_by_name?: string;
  created_by_role?: string;
};

/** One player slot for offline match observation (minimal fields to create observation). */
export type OfflineMatchSlot = {
  player_id?: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  birth_date?: string | null;
  club_name?: string;
  primary_position: string;
  overall_rating: number;
  match_performance_rating: number;
  recommendation: "positive" | "to_observe" | "negative";
  summary: string;
  strengths?: string;
  weaknesses?: string;
  potential_now?: number;
  potential_future?: number;
};

export type OfflineMatchObservation = {
  localId: string;
  matchHeader: OfflineMatchHeader;
  slots: OfflineMatchSlot[];
  createdAt: Date;
  syncStatus: "pending" | "syncing" | "synced" | "failed";
  syncAttempts: number;
  syncError?: string;
  lastSyncAttempt?: Date;
};

export class OfflineDatabase extends Dexie {
  offlineObservations!: Table<OfflineObservation>;
  offlineMatchObservations!: Table<OfflineMatchObservation>;
  cachedPlayers!: Table<CachedPlayer>;
  cachedObservations!: Table<CachedObservation>;

  constructor() {
    super("ScoutProOffline");
    this.version(1).stores({
      offlineObservations: "localId, syncStatus, createdAt",
      cachedPlayers: "id, cachedAt",
      cachedObservations: "id, cachedAt",
    });
    this.version(2).stores({
      offlineMatchObservations: "localId, syncStatus, createdAt",
    });
  }
}

export const offlineDb = new OfflineDatabase();
