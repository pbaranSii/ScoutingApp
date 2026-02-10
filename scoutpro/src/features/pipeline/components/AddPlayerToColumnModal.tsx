import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPlayers } from "@/features/players/api/players.api";
import type { Player } from "@/features/players/types";
import { useUpdatePlayerStatus } from "@/features/players/hooks/usePlayers";
import { useAuthStore } from "@/stores/authStore";
import { ALL_PIPELINE_STATUSES } from "../types";
import type { PipelineStatus } from "../types";
import { toast } from "@/hooks/use-toast";

const SEARCH_DEBOUNCE_MS = 300;
const MAX_RESULTS = 20;
const MIN_SEARCH_LENGTH = 2;

type AddPlayerToColumnModalProps = {
  columnId: PipelineStatus;
  columnLabel: string;
  onClose: () => void;
  onAdded?: () => void;
};

export function AddPlayerToColumnModal({
  columnId,
  columnLabel,
  onClose,
  onAdded,
}: AddPlayerToColumnModalProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuthStore();
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdatePlayerStatus();

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const players = await fetchPlayers({ search: trimmed });
      setResults(players.slice(0, MAX_RESULTS));
    } catch {
      setResults([]);
      toast({
        variant: "destructive",
        title: "Błąd wyszukiwania",
        description: "Nie udało się pobrać listy zawodników.",
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      runSearch(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, runSearch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSelect = async (player: Player) => {
    try {
      await updateStatus({
        id: player.id,
        status: columnId,
        fromStatus: player.pipeline_status ?? null,
      });
      toast({
        title: "Zawodnik dodany",
        description: `${player.first_name} ${player.last_name} został przypisany do ${columnLabel}.`,
      });
      onAdded?.();
      onClose();
    } catch {
      toast({
        variant: "destructive",
        title: "Nie udało się dodać",
        description: "Spróbuj ponownie za chwilę.",
      });
    }
  };

  const statusLabel = (status: string | null | undefined) =>
    ALL_PIPELINE_STATUSES.find((s) => s.id === status)?.label ?? status ?? "—";

  const canUseDom = typeof document !== "undefined";

  return canUseDom
    ? createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
            aria-hidden
          />
          <div
            className="relative z-[71] flex w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Dodaj zawodnika do {columnLabel}
              </h2>
              <button
                type="button"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={onClose}
                aria-label="Zamknij"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <Input
                placeholder="Szukaj po imieniu lub nazwisku (min. 2 znaki)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full"
              />
              <div className="max-h-[320px] overflow-y-auto rounded border border-slate-200">
                {search.trim().length > 0 && search.trim().length < MIN_SEARCH_LENGTH && (
                  <p className="p-3 text-sm text-slate-500">
                    Wpisz co najmniej {MIN_SEARCH_LENGTH} znaki, aby wyszukać.
                  </p>
                )}
                {search.trim().length >= MIN_SEARCH_LENGTH && isSearching && (
                  <p className="p-3 text-sm text-slate-500">Szukam...</p>
                )}
                {search.trim().length >= MIN_SEARCH_LENGTH && !isSearching && results.length === 0 && (
                  <p className="p-3 text-sm text-slate-500">Brak pasujących zawodników.</p>
                )}
                {!isSearching && results.length > 0 && (
                  <ul className="divide-y divide-slate-100">
                    {results.map((player) => (
                      <li key={player.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                          onClick={() => handleSelect(player)}
                          disabled={isUpdating}
                        >
                          <span className="font-medium text-slate-900">
                            {player.first_name} {player.last_name}
                          </span>
                          <span className="text-slate-500">
                            {player.club?.name ?? "—"} · {statusLabel(player.pipeline_status)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex justify-end border-t p-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;
}
