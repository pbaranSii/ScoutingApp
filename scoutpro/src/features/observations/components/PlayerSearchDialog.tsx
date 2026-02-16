import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPlayers, type PlayerSearchItem } from "@/features/players/api/players.api";
import { formatPosition } from "@/features/players/positions";

type PlayerSearchDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelectPlayer: (player: PlayerSearchItem) => void;
  onAddNew: (searchQuery?: string) => void;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export function PlayerSearchDialog({
  open,
  onClose,
  onSelectPlayer,
  onAddNew,
}: PlayerSearchDialogProps) {
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
    setQuery("");
    setResults([]);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => {
      runSearch(query);
    }, DEBOUNCE_MS);
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

  if (!open) return null;

  const canUseDom = typeof document !== "undefined";
  if (!canUseDom) return null;

  const secondary = (p: PlayerSearchItem) => {
    const parts = [
      p.birth_year,
      p.club?.name ?? "—",
      p.primary_position ? formatPosition(p.primary_position) : "",
    ].filter(Boolean);
    return parts.join(" | ");
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div
        className="relative z-[71] w-full max-w-md rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-search-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <h2 id="player-search-title" className="text-lg font-semibold">
            Wybierz zawodnika
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
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isSearching && (
            <p className="py-4 text-center text-sm text-slate-500">Szukam...</p>
          )}
          {!isSearching && query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">
              Brak wyników. Możesz dodać nowego zawodnika.
            </p>
          )}
          {!isSearching &&
            results.map((player) => (
              <button
                key={player.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                onClick={() => {
                  onSelectPlayer(player);
                  onClose();
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                  {player.first_name?.charAt(0) ?? ""}
                  {player.last_name?.charAt(0) ?? ""}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">
                    {player.first_name} {player.last_name}
                  </div>
                  <div className="text-sm text-slate-500">{secondary(player)}</div>
                </div>
              </button>
            ))}
        </div>
        <div className="border-t border-slate-200 p-3">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              onAddNew(query.trim() || undefined);
              onClose();
            }}
          >
            <UserPlus className="h-4 w-4" />
            {query.trim().length >= MIN_QUERY_LENGTH
              ? `Dodaj nowego zawodnika${query.trim() ? ` "${query.trim()}"` : ""}`
              : "Dodaj nowego zawodnika"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
