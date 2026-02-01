import Dexie, { Table } from "dexie";

export type OfflineObservation = {
  localId: string;
  remoteId?: string;
  data: {
    player_id?: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    club_name?: string;
    primary_position?: string;
    dominant_foot?: string;
    source: string;
    rank?: string;
    notes?: string;
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
