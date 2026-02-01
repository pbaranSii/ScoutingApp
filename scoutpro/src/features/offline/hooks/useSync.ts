import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { offlineDb, OfflineObservation } from "../db/offlineDb";

const MAX_RETRY_ATTEMPTS = 3;

export function useSync() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const updatePending = async () => {
      const count = await offlineDb.offlineObservations
        .where("syncStatus")
        .anyOf(["pending", "failed"])
        .count();
      setPendingCount(count);
    };
    updatePending();
    const interval = setInterval(updatePending, 5000);
    return () => clearInterval(interval);
  }, []);

  const syncPendingObservations = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const pending = await offlineDb.offlineObservations
        .where("syncStatus")
        .anyOf(["pending", "failed"])
        .filter((obs) => obs.syncAttempts < MAX_RETRY_ATTEMPTS)
        .toArray();

      setSyncProgress({ current: 0, total: pending.length });

      for (let i = 0; i < pending.length; i += 1) {
        const obs = pending[i];
        setSyncProgress({ current: i + 1, total: pending.length });
        try {
          await offlineDb.offlineObservations.update(obs.localId, {
            syncStatus: "syncing",
            lastSyncAttempt: new Date(),
          });

          let playerId = obs.data.player_id;
          if (!playerId) {
            const { data: player, error: playerError } = await supabase
              .from("players")
              .insert({
                first_name: obs.data.first_name,
                last_name: obs.data.last_name,
                birth_year: obs.data.birth_year,
                primary_position: obs.data.primary_position,
                dominant_foot: obs.data.dominant_foot,
              })
              .select()
              .single();

            if (playerError) throw playerError;
            playerId = player.id as string;
          }

          const { data: observation, error: obsError } = await supabase
            .from("observations")
            .insert({
              player_id: playerId,
              source: obs.data.source,
              rank: obs.data.rank,
              notes: obs.data.notes,
              potential_now: obs.data.potential_now,
              potential_future: obs.data.potential_future,
              observation_date: obs.data.observation_date,
              is_offline_created: true,
            })
            .select()
            .single();

          if (obsError) throw obsError;

          await offlineDb.offlineObservations.update(obs.localId, {
            remoteId: observation.id as string,
            syncStatus: "synced",
            syncError: undefined,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Nieznany blad";
          await offlineDb.offlineObservations.update(obs.localId, {
            syncStatus: "failed",
            syncAttempts: obs.syncAttempts + 1,
            syncError: message,
          });
        }
      }
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [isSyncing]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingObservations();
    }
  }, [isOnline, pendingCount, syncPendingObservations]);

  const addOfflineObservation = useCallback(
    async (payload: OfflineObservation) => {
      await offlineDb.offlineObservations.add(payload);
      const count = await offlineDb.offlineObservations
        .where("syncStatus")
        .anyOf(["pending", "failed"])
        .count();
      setPendingCount(count);
    },
    []
  );

  return {
    pendingCount,
    isSyncing,
    syncProgress,
    syncPendingObservations,
    addOfflineObservation,
  };
}
