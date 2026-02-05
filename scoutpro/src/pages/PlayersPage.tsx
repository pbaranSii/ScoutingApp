import { useEffect, useState } from "react";
import { usePlayers } from "@/features/players/hooks/usePlayers";
import { PlayerList } from "@/features/players/components/PlayerList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POSITION_OPTIONS } from "@/features/players/positions";
import { SlidersHorizontal } from "lucide-react";

export function PlayersPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = usePlayers({ search });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    position: "",
    status: "",
    birthYear: "",
  });
  const hasActiveFilters = filters.position || filters.status || filters.birthYear;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const filteredPlayers = data.filter((player) => {
    if (filters.position && player.primary_position !== filters.position) return false;
    if (filters.status && player.pipeline_status !== filters.status) return false;
    if (filters.birthYear && String(player.birth_year) !== String(filters.birthYear)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Zawodnicy"
        subtitle="Lista zawodnikow z bazy scoutingowej."
        actions={
          <Button asChild>
            <Link to="/players/new">Dodaj zawodnika</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Szukaj po nazwisku lub imieniu"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setFiltersOpen((prev) => !prev)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtry
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-slate-900 px-2 text-[11px] text-white">
              aktywne
            </span>
          )}
        </Button>
      </div>
      {filtersOpen && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Pozycja</label>
              <Select value={filters.position} onValueChange={(value) => setFilters((prev) => ({ ...prev, position: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dowolna" />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label} ({option.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dowolny" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="observed">Obserwowany</SelectItem>
                  <SelectItem value="shortlist">Shortlista</SelectItem>
                  <SelectItem value="trial">Testy</SelectItem>
                  <SelectItem value="signed">Podpisany</SelectItem>
                  <SelectItem value="archived">Archiwum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rocznik</label>
              <Input
                type="number"
                inputMode="numeric"
                value={filters.birthYear}
                onChange={(event) => setFilters((prev) => ({ ...prev, birthYear: event.target.value }))}
                placeholder="np. 2008"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilters({ position: "", status: "", birthYear: "" })}
            >
              Wyczyść
            </Button>
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Zastosuj
            </Button>
          </div>
        </div>
      )}

      <PlayerList players={filteredPlayers} isLoading={isLoading} />
    </div>
  );
}
