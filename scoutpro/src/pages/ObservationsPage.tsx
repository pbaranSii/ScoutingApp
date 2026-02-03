import { useObservations } from "@/features/observations/hooks/useObservations";
import { useMemo, useState } from "react";
import { ObservationList } from "@/features/observations/components/ObservationList";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

export function ObservationsPage() {
  const { data = [], isLoading, isError, error } = useObservations();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter((observation) => {
      const playerName = `${observation.player?.first_name ?? ""} ${observation.player?.last_name ?? ""}`.toLowerCase();
      const notes = observation.notes?.toLowerCase() ?? "";
      const strengths = observation.strengths?.toLowerCase() ?? "";
      const weaknesses = observation.weaknesses?.toLowerCase() ?? "";
      const competition = observation.competition?.toLowerCase() ?? "";
      const source = observation.source?.toLowerCase() ?? "";
      const rank = observation.rank?.toLowerCase() ?? "";
      return (
        playerName.includes(query) ||
        notes.includes(query) ||
        strengths.includes(query) ||
        weaknesses.includes(query) ||
        competition.includes(query) ||
        source.includes(query) ||
        rank.includes(query)
      );
    });
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Obserwacje</h1>
        <Button asChild>
          <Link to="/observations/new">Dodaj obserwacje</Link>
        </Button>
      </div>
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : "Nie udalo sie pobrac obserwacji."}
        </div>
      )}
      <Input
        placeholder="Szukaj po nazwisku, zrodle, rozgrywkach lub notatce"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <ObservationList observations={filtered} isLoading={isLoading} />
    </div>
  );
}
