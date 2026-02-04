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
    source: ObservationSource;
    rank?: string;
    notes?: string;
    strengths?: string;
    weaknesses?: string;
    overall_rating?: number;
    competition?: string;
    photo_url?: string;
    created_by?: string;
    created_by_name?: string;
    created_by_role?: string;
    updated_by?: string;
    updated_by_name?: string;
    updated_by_role?: string;
    updated_at?: string;
    potential_now?: number;
    potential_future?: number;
    observation_date: string;
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

export class OfflineDatabase extends Dexie {
  offlineObservations!: Table<OfflineObservation>;
  cachedPlayers!: Table<CachedPlayer>;
  cachedObservations!: Table<CachedObservation>;

  constructor() {
    super("ScoutProOffline");
    this.version(1).stores({
      offlineObservations: "localId, syncStatus, createdAt",
      cachedPlayers: "id, cachedAt",
      cachedObservations: "id, cachedAt",
    });
  }
}

export const offlineDb = new OfflineDatabase();
