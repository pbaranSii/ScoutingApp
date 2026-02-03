import { useObservations } from "@/features/observations/hooks/useObservations";
import { useMemo, useState } from "react";
import { ObservationList } from "@/features/observations/components/ObservationList";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { Mic, Plus, Search, SlidersHorizontal } from "lucide-react";
import { POSITION_OPTIONS, mapLegacyPosition } from "@/features/players/positions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ObservationsPage() {
  const { data = [], isLoading, isError, error } = useObservations();
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    source: "",
    rank: "",
    position: "",
    ratingMin: "",
    ratingMax: "",
  });
  const hasActiveFilters =
    filters.source ||
    filters.rank ||
    filters.position ||
    filters.ratingMin ||
    filters.ratingMax;

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
  const filteredWithFilters = useMemo(() => {
    return filtered.filter((observation) => {
      if (filters.source && observation.source !== filters.source) return false;
      if (filters.rank && observation.rank !== filters.rank) return false;
      if (filters.position) {
        const normalized = mapLegacyPosition(observation.player?.primary_position ?? "");
        if (normalized !== filters.position) return false;
      }
      const rating = observation.overall_rating;
      if (filters.ratingMin && (typeof rating !== "number" || rating < Number(filters.ratingMin))) {
        return false;
      }
      if (filters.ratingMax && (typeof rating !== "number" || rating > Number(filters.ratingMax))) {
        return false;
      }
      return true;
    });
  }, [filtered, filters]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Obserwacje"
        subtitle="Zarzadzaj i przegladaj raporty scoutingowe"
        actions={
          <>
            <Button asChild className="gap-2 bg-red-600 hover:bg-red-700">
              <Link to="/observations/new">
                <Plus className="h-4 w-4" />
                Nowa obserwacja
              </Link>
            </Button>
            <Button type="button" className="gap-2 bg-red-600 hover:bg-red-700">
              <Mic className="h-4 w-4" />
              Nagraj obserwacje
            </Button>
          </>
        }
      />
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : "Nie udalo sie pobrac obserwacji."}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Szukaj zawodnika lub klubu..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Zrodlo</label>
              <Select value={filters.source} onValueChange={(value) => setFilters((prev) => ({ ...prev, source: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dowolne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scouting">Skauting</SelectItem>
                  <SelectItem value="referral">Polecenie</SelectItem>
                  <SelectItem value="application">Zgloszenie</SelectItem>
                  <SelectItem value="trainer_report">Raport trenera</SelectItem>
                  <SelectItem value="scout_report">Raport skauta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Ranga</label>
              <Select value={filters.rank} onValueChange={(value) => setFilters((prev) => ({ ...prev, rank: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dowolna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - TOP</SelectItem>
                  <SelectItem value="B">B - Dobry</SelectItem>
                  <SelectItem value="C">C - Szeroka kadra</SelectItem>
                  <SelectItem value="D">D - Slaby</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <label className="text-sm font-medium text-slate-700">Ocena od</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={filters.ratingMin}
                onChange={(event) => setFilters((prev) => ({ ...prev, ratingMin: event.target.value }))}
                placeholder="np. 6"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Ocena do</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={filters.ratingMax}
                onChange={(event) => setFilters((prev) => ({ ...prev, ratingMax: event.target.value }))}
                placeholder="np. 9"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilters({ source: "", rank: "", position: "", ratingMin: "", ratingMax: "" })}
            >
              Wyczyść
            </Button>
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Zastosuj
            </Button>
          </div>
        </div>
      )}
      <ObservationList observations={filteredWithFilters} isLoading={isLoading} />
    </div>
  );
}
