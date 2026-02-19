import { useQuery } from "@tanstack/react-query";
import type { Player } from "../types";
import { PlayerCard } from "./PlayerCard";
import { fetchLatestObservationRatings } from "@/features/observations/api/observations.api";

type PlayerListProps = {
  players: Player[];
  isLoading: boolean;
};

function playerIdsKey(playerIds: string[]): string {
  if (playerIds.length === 0) return "";
  return [...playerIds].sort().join(",");
}

export function PlayerList({ players, isLoading }: PlayerListProps) {
  const playerIds = players.map((p) => p.id);
  const stableKey = playerIdsKey(playerIds);

  const { data: latestRating = {} } = useQuery({
    queryKey: ["observations-latest-ratings", stableKey],
    queryFn: () => fetchLatestObservationRatings(playerIds),
    enabled: playerIds.length > 0,
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!players.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
        Brak zawodnikow. Dodaj pierwszego zawodnika.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          latestRating={latestRating[player.id] ?? null}
        />
      ))}
    </div>
  );
}
