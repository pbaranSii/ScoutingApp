import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  searchPlayers,
  type PlayerSearchItem,
} from "@/features/players/api/players.api";
import { formatPosition } from "@/features/players/positions";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

type TaskPlayerPickerModalProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Used to resolve names for already selected players (e.g. from initial form data). */
  players: PlayerSearchItem[];
};

export function TaskPlayerPickerModal({
  open,
  onClose,
  selectedIds,
  onChange,
  players,
}: TaskPlayerPickerModalProps) {
  const [localIds, setLocalIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await searchPlayers(q.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setLocalIds(selectedIds);
    setQuery("");
    setResults([]);
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const toggle = useCallback((id: string) => {
    setLocalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLocalIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const handleConfirm = useCallback(() => {
    onChange(localIds);
    onClose();
  }, [localIds, onChange, onClose]);

  const getDisplayName = useCallback(
    (id: string): string => {
      const fromPlayers = players.find((p) => p.id === id);
      if (fromPlayers)
        return `${fromPlayers.first_name} ${fromPlayers.last_name}`;
      const fromResults = results.find((p) => p.id === id);
      if (fromResults)
        return `${fromResults.first_name} ${fromResults.last_name}`;
      return id;
    },
    [players, results]
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-[71] flex w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-player-picker-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <h2
            id="task-player-picker-title"
            className="text-lg font-semibold"
          >
            Wybierz zawodników
          </h2>
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Wpisz imię lub nazwisko..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Wpisz co najmniej {MIN_QUERY_LENGTH} znaki
          </p>
        </div>

        {localIds.length > 0 && (
          <div className="border-b border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">
              Wybrani zawodnicy ({localIds.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {localIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                >
                  {getDisplayName(id)}
                  <button
                    type="button"
                    className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                    onClick={() => remove(id)}
                    aria-label={`Usuń ${getDisplayName(id)}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[40vh] flex-1 overflow-y-auto p-3">
          {isSearching && (
            <p className="py-4 text-center text-sm text-slate-500">
              Szukam...
            </p>
          )}
          {!isSearching &&
            query.trim().length >= MIN_QUERY_LENGTH &&
            results.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">
                Brak wyników.
              </p>
            )}
          {!isSearching &&
            query.trim().length >= MIN_QUERY_LENGTH &&
            results.map((player) => {
              const checked = localIds.includes(player.id);
              const clubName = player.club?.name ?? "—";
              const positionLabel = formatPosition(
                player.primary_position ?? ""
              );
              return (
                <label
                  key={player.id}
                  className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(player.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm">
                    {player.first_name} {player.last_name} ({positionLabel},{" "}
                    {clubName})
                  </span>
                </label>
              );
            })}
        </div>

        <div className="border-t border-slate-200 p-3">
          <Button type="button" className="w-full gap-2" onClick={handleConfirm}>
            <Check className="h-4 w-4" />
            Zatwierdź
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
