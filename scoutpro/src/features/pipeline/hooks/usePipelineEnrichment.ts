import { useQueries } from "@tanstack/react-query";
import type { Player } from "@/features/players/types";
import { fetchPipelineHistoryBatch } from "@/features/players/api/players.api";
import { fetchLatestObservationRatings } from "@/features/observations/api/observations.api";
import type { PipelineHistoryEntry } from "@/features/players/types";

function buildStatusSinceMap(
  players: Player[],
  entries: PipelineHistoryEntry[]
): Record<string, string> {
  const byPlayer = new Map<string, PipelineHistoryEntry[]>();
  for (const e of entries) {
    const list = byPlayer.get(e.player_id) ?? [];
    list.push(e);
    byPlayer.set(e.player_id, list);
  }
  const map: Record<string, string> = {};
  for (const player of players) {
    const list = byPlayer.get(player.id) ?? [];
    const current = player.pipeline_status ?? "unassigned";
    const entry = list.find((e) => e.to_status === current);
    if (entry?.created_at) map[player.id] = entry.created_at;
  }
  return map;
}

/** Stable key for same set of player IDs (avoids duplicate fetches when array reference changes). */
function playerIdsKey(playerIds: string[]): string {
  if (playerIds.length === 0) return "";
  return [...playerIds].sort().join(",");
}

export function usePipelineEnrichment(players: Player[]) {
  const playerIds = players.map((p) => p.id);
  const stableKey = playerIdsKey(playerIds);

  const [historyQuery, ratingsQuery] = useQueries({
    queries: [
      {
        queryKey: ["pipeline-history-batch", stableKey],
        queryFn: () => fetchPipelineHistoryBatch(playerIds),
        enabled: playerIds.length > 0,
      },
      {
        queryKey: ["observations-latest-ratings", stableKey],
        queryFn: () => fetchLatestObservationRatings(playerIds),
        enabled: playerIds.length > 0,
      },
    ],
  });

  const historyEntries = historyQuery.data ?? [];
  const statusSince = buildStatusSinceMap(players, historyEntries);
  const latestRating = ratingsQuery.data ?? {};

  return {
    statusSince,
    latestRating,
    isLoading: historyQuery.isLoading || ratingsQuery.isLoading,
  };
}
