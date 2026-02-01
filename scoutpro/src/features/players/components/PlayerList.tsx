import type { Player } from "../types";
import { PlayerCard } from "./PlayerCard";

type PlayerListProps = {
  players: Player[];
  isLoading: boolean;
};

export function PlayerList({ players, isLoading }: PlayerListProps) {
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
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}
