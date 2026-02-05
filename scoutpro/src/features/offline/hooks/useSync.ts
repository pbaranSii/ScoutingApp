import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { offlineDb } from "../db/offlineDb";
import type { OfflineObservation } from "../db/offlineDb";

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
              })
              .select()
              .single();

            if (playerError) throw playerError;
            playerId = player.id as string;
          }

          if (playerId && obs.data.should_update_player) {
            const updatePayload: Database["public"]["Tables"]["players"]["Update"] = {
              first_name: obs.data.first_name,
              last_name: obs.data.last_name,
              birth_year: obs.data.birth_year,
              primary_position: obs.data.primary_position ?? null,
            };
            if (typeof obs.data.club_name === "string") {
              const trimmedClub = obs.data.club_name.trim();
              if (trimmedClub.length === 0) {
                updatePayload.club_id = null;
              } else {
                const { data: club, error: clubError } = await supabase
                  .from("clubs")
                  .select("id")
                  .eq("name", trimmedClub)
                  .maybeSingle();
                if (clubError) throw clubError;
                if (club?.id) {
                  updatePayload.club_id = club.id as string;
                }
              }
            }
            const { error: updateError } = await supabase
              .from("players")
              .update(updatePayload)
              .eq("id", playerId);
            if (updateError) throw updateError;
          }

          const scoutId = obs.data.scout_id;
          if (!scoutId) {
            throw new Error("Brak scout_id do synchronizacji obserwacji.");
          }

          const insertPayload: Database["public"]["Tables"]["observations"]["Insert"] = {
              player_id: playerId,
              scout_id: scoutId,
              source: obs.data.source,
              rank: obs.data.rank ?? null,
              notes: obs.data.notes ?? null,
              potential_now: obs.data.potential_now ?? null,
              potential_future: obs.data.potential_future ?? null,
              observation_date: obs.data.observation_date,
              competition: obs.data.competition ?? null,
              overall_rating: obs.data.overall_rating ?? null,
              strengths: obs.data.strengths ?? null,
              weaknesses: obs.data.weaknesses ?? null,
              photo_url: obs.data.photo_url ?? null,
              created_by: obs.data.created_by ?? null,
              created_by_name: obs.data.created_by_name ?? null,
              created_by_role: obs.data.created_by_role ?? null,
              updated_by: obs.data.updated_by ?? null,
              updated_by_name: obs.data.updated_by_name ?? null,
              updated_by_role: obs.data.updated_by_role ?? null,
              updated_at: obs.data.updated_at ?? null,
              is_offline_created: true,
            };

          const { data: observation, error: obsError } = await supabase
            .from("observations")
            .insert(insertPayload)
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
