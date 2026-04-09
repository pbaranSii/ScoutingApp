import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchPlayers, type PlayerSearchItem } from "@/features/players/api/players.api";
import { formatPosition } from "@/features/players/positions";
import { useAddPlayerToList } from "../hooks/useListMembers";
import { toast } from "@/hooks/use-toast";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

type AddPlayerToListDialogProps = {
  open: boolean;
  onClose: () => void;
  listId: string | null;
  existingPlayerIds?: string[];
  onAdded?: (playerId: string) => void;
};

export function AddPlayerToListDialog({
  open,
  onClose,
  listId,
  existingPlayerIds = [],
  onAdded,
}: AddPlayerToListDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const addMutation = useAddPlayerToList(listId);

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
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  const handleSelect = (player: PlayerSearchItem) => {
    if (!listId) return;
    if (existingPlayerIds.includes(player.id)) {
      toast({ title: "Zawodnik jest już na liście", variant: "default" });
      return;
    }
    addMutation.mutate(player.id, {
      onSuccess: () => {
        toast({ title: `Dodano ${player.first_name} ${player.last_name} do listy` });
        onAdded?.(player.id);
        onClose();
      },
      onError: (e) => {
        toast({ variant: "destructive", title: "Błąd", description: e.message });
      },
    });
  };

  const secondary = (p: PlayerSearchItem) => {
    const parts = [
      p.birth_year,
      p.club?.name ?? "—",
      p.primary_position ? formatPosition(p.primary_position) : "",
    ].filter(Boolean);
    return parts.join(" | ");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj zawodnika do listy</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
          <p className="text-xs text-slate-500">
            Wpisz co najmniej {MIN_QUERY_LENGTH} znaki
          </p>
          <div className="max-h-[50vh] overflow-y-auto rounded border border-slate-200 p-2">
            {isSearching && (
              <p className="py-4 text-center text-sm text-slate-500">Szukam...</p>
            )}
            {!isSearching && query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-500">Brak wyników.</p>
            )}
            {!isSearching &&
              results.map((player) => {
                const onList = existingPlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    disabled={onList}
                    className="flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition hover:border-slate-200 hover:bg-slate-50 disabled:opacity-60 disabled:hover:bg-transparent"
                    onClick={() => handleSelect(player)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                      {player.first_name?.charAt(0) ?? ""}
                      {player.last_name?.charAt(0) ?? ""}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900">
                        {player.first_name} {player.last_name}
                        {onList && (
                          <span className="ml-2 text-xs font-normal text-slate-500">(już na liście)</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{secondary(player)}</div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
