import { useMemo } from "react";
import type { PlayerSearchItem } from "@/features/players/api/players.api";
import { formatPosition } from "@/features/players/positions";

type PlayerPickerProps = {
  players: PlayerSearchItem[];
  selectedIds: string[];
  onToggle: (playerId: string) => void;
  onRemove: (playerId: string) => void;
  isLoading?: boolean;
};

export function PlayerPicker({
  players,
  selectedIds,
  onToggle,
  onRemove,
  isLoading,
}: PlayerPickerProps) {
  const selectedPlayers = useMemo(
    () => players.filter((p) => selectedIds.includes(p.id)),
    [players, selectedIds]
  );

  return (
    <div className="space-y-3">
      {selectedPlayers.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Wybrani zawodnicy ({selectedPlayers.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedPlayers.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
              >
                {p.first_name} {p.last_name}
                <button
                  type="button"
                  className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                  onClick={() => onRemove(p.id)}
                  aria-label={`Usuń ${p.first_name} ${p.last_name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          Lista dostępnych zawodników
        </p>
        <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-md border border-slate-200 p-2">
          {isLoading ? (
            <p className="text-sm text-slate-500">Ładowanie...</p>
          ) : (
            players.map((player) => {
              const checked = selectedIds.includes(player.id);
              const clubName = player.club?.name ?? "—";
              const positionLabel = formatPosition(player.primary_position ?? "");
              return (
                <label
                  key={player.id}
                  className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(player.id)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm">
                    {player.first_name} {player.last_name} ({positionLabel},{" "}
                    {clubName})
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
