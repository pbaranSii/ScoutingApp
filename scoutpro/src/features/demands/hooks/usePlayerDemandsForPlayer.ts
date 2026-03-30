import { useQuery } from "@tanstack/react-query";
import { fetchDemandsContainingPlayer } from "../api/candidates.api";
import { fetchPlayerDemandsByIds } from "../api/demands.api";
import type { PlayerDemand } from "../types";

export function usePlayerDemandsForPlayer(playerId: string | null) {
  return useQuery({
    queryKey: ["player-demands-for-player", playerId],
    queryFn: async (): Promise<PlayerDemand[]> => {
      if (!playerId) return [];
      const refs = await fetchDemandsContainingPlayer(playerId);
      const ids = refs.map((r) => r.demand_id).filter(Boolean);
      if (ids.length === 0) return [];
      return fetchPlayerDemandsByIds(ids);
    },
    enabled: Boolean(playerId),
  });
}
