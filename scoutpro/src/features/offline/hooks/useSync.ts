import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { offlineDb } from "../db/offlineDb";
import type { OfflineObservation, OfflineMatchObservation } from "../db/offlineDb";
import { createMatchObservation } from "@/features/observations/api/matchObservations.api";
import { createObservation } from "@/features/observations/api/observations.api";

const MAX_RETRY_ATTEMPTS = 3;

export function useSync() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const updatePending = async () => {
      const [obsCount, matchCount] = await Promise.all([
        offlineDb.offlineObservations
          .where("syncStatus")
          .anyOf(["pending", "failed"])
          .count(),
        offlineDb.offlineMatchObservations
          .where("syncStatus")
          .anyOf(["pending", "failed"])
          .count(),
      ]);
      setPendingCount(obsCount + matchCount);
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
              match_result: obs.data.match_result ?? null,
              location: obs.data.location ?? null,
              positions: obs.data.positions ?? null,
              overall_rating: obs.data.overall_rating ?? null,
              technical_rating: obs.data.technical_rating ?? null,
              speed_rating: obs.data.speed_rating ?? null,
              motor_rating: obs.data.motor_rating ?? null,
              motor_speed_rating: obs.data.motor_speed_rating ?? null,
              motor_endurance_rating: obs.data.motor_endurance_rating ?? null,
              motor_jump_rating: obs.data.motor_jump_rating ?? null,
              motor_agility_rating: obs.data.motor_agility_rating ?? null,
              motor_acceleration_rating: obs.data.motor_acceleration_rating ?? null,
              motor_strength_rating: obs.data.motor_strength_rating ?? null,
              motor_description: obs.data.motor_description ?? null,
              tactical_rating: obs.data.tactical_rating ?? null,
              mental_rating: obs.data.mental_rating ?? null,
              strengths: obs.data.strengths ?? null,
              strengths_notes: obs.data.strengths_notes ?? null,
              weaknesses: obs.data.weaknesses ?? null,
              weaknesses_notes: obs.data.weaknesses_notes ?? null,
              team_role: obs.data.team_role ?? null,
              recommendations: obs.data.recommendations ?? null,
              photo_url: obs.data.photo_url ?? null,
              created_by: obs.data.created_by ?? null,
              created_by_name: obs.data.created_by_name ?? null,
              created_by_role: obs.data.created_by_role ?? null,
              updated_by: obs.data.updated_by ?? null,
              updated_by_name: obs.data.updated_by_name ?? null,
              updated_by_role: obs.data.updated_by_role ?? null,
              updated_at: obs.data.updated_at ?? null,
              is_offline_created: true,
              match_observation_id: obs.data.match_observation_id ?? null,
              observation_category: obs.data.observation_category ?? null,
              form_type: obs.data.form_type ?? null,
              match_performance_rating: obs.data.match_performance_rating ?? null,
              summary: obs.data.summary ?? null,
              recommendation: obs.data.recommendation ?? null,
              mental_description: obs.data.mental_description ?? null,
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
            error instanceof Error ? error.message : "Nieznany błąd";
          await offlineDb.offlineObservations.update(obs.localId, {
            syncStatus: "failed",
            syncAttempts: obs.syncAttempts + 1,
            syncError: message,
          });
        }
      }

      const pendingMatch = await offlineDb.offlineMatchObservations
        .where("syncStatus")
        .anyOf(["pending", "failed"])
        .filter((m) => m.syncAttempts < MAX_RETRY_ATTEMPTS)
        .toArray();

      for (let i = 0; i < pendingMatch.length; i += 1) {
        const matchObs = pendingMatch[i];
        setSyncProgress({
          current: pending.length + i + 1,
          total: pending.length + pendingMatch.length,
        });
        try {
          await offlineDb.offlineMatchObservations.update(matchObs.localId, {
            syncStatus: "syncing",
            lastSyncAttempt: new Date(),
          });
          const header = matchObs.matchHeader;
          const match = await createMatchObservation({
            context_type: header.context_type,
            observation_date: header.observation_date,
            competition: header.competition,
            home_team: header.home_team ?? null,
            away_team: header.away_team ?? null,
            match_result: header.match_result ?? null,
            location: header.location ?? null,
            source: header.source,
            scout_id: header.scout_id,
            home_team_formation: header.home_team_formation ?? null,
            away_team_formation: header.away_team_formation ?? null,
            match_notes: header.match_notes ?? null,
          });
          for (const slot of matchObs.slots) {
            let playerId = slot.player_id;
            if (!playerId) {
              const { data: player, error: playerError } = await supabase
                .from("players")
                .insert({
                  first_name: slot.first_name,
                  last_name: slot.last_name,
                  birth_year: slot.birth_year,
                  primary_position: slot.primary_position,
                })
                .select()
                .single();
              if (playerError) throw playerError;
              playerId = player.id as string;
            }
            await createObservation({
              player_id: playerId,
              scout_id: header.scout_id,
              source: header.source as Database["public"]["Enums"]["observation_source"],
              observation_date: header.observation_date,
              match_observation_id: match.id,
              observation_category: "match_player",
              form_type: "simplified",
              overall_rating: slot.overall_rating,
              match_performance_rating: slot.match_performance_rating,
              recommendation: slot.recommendation,
              summary: slot.summary,
              positions: [slot.primary_position],
              strengths: slot.strengths?.trim() || null,
              weaknesses: slot.weaknesses?.trim() || null,
              potential_now: slot.potential_now ?? null,
              potential_future: slot.potential_future ?? null,
              created_by: header.created_by ?? header.scout_id,
              created_by_name: header.created_by_name ?? null,
              created_by_role: header.created_by_role ?? null,
              updated_by: header.created_by ?? header.scout_id,
              updated_by_name: header.created_by_name ?? null,
              updated_by_role: header.created_by_role ?? null,
            });
          }
          await offlineDb.offlineMatchObservations.update(matchObs.localId, {
            syncStatus: "synced",
            syncError: undefined,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Nieznany błąd";
          await offlineDb.offlineMatchObservations.update(matchObs.localId, {
            syncStatus: "failed",
            syncAttempts: matchObs.syncAttempts + 1,
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
      const [obsCount, matchCount] = await Promise.all([
        offlineDb.offlineObservations.where("syncStatus").anyOf(["pending", "failed"]).count(),
        offlineDb.offlineMatchObservations.where("syncStatus").anyOf(["pending", "failed"]).count(),
      ]);
      setPendingCount(obsCount + matchCount);
    },
    []
  );

  const addOfflineMatchObservation = useCallback(
    async (payload: OfflineMatchObservation) => {
      await offlineDb.offlineMatchObservations.add(payload);
      const [obsCount, matchCount] = await Promise.all([
        offlineDb.offlineObservations.where("syncStatus").anyOf(["pending", "failed"]).count(),
        offlineDb.offlineMatchObservations.where("syncStatus").anyOf(["pending", "failed"]).count(),
      ]);
      setPendingCount(obsCount + matchCount);
    },
    []
  );

  return {
    pendingCount,
    isSyncing,
    syncProgress,
    syncPendingObservations,
    addOfflineObservation,
    addOfflineMatchObservation,
  };
}
