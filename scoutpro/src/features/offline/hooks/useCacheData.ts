import { useEffect } from "react";
import { offlineDb } from "../db/offlineDb";
import { supabase } from "@/lib/supabase";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuthStore } from "@/stores/authStore";

export function useCacheData() {
  const isOnline = useOnlineStatus();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!isOnline || !user) return;

    const cacheRecentData = async () => {
      const now = new Date();

      const { data: players } = await supabase
        .from("players")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (players) {
        await offlineDb.cachedPlayers.bulkPut(
          players.map((player) => ({
            id: player.id as string,
            data: player,
            cachedAt: now,
          }))
        );
      }

      const { data: observations } = await supabase
        .from("observations")
        .select("*, player:players(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (observations) {
        await offlineDb.cachedObservations.bulkPut(
          observations.map((obs) => ({
            id: obs.id as string,
            data: obs,
            cachedAt: now,
          }))
        );
      }
    };

    cacheRecentData();
  }, [isOnline, user]);
}
