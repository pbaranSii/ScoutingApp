import { useObservations } from "@/features/observations/hooks/useObservations";
import { useMemo, useState, useEffect } from "react";
import { ObservationList } from "@/features/observations/components/ObservationList";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { POSITION_OPTIONS, mapLegacyPosition } from "@/features/players/positions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Observation } from "@/features/observations/types";

const PAGE_SIZE = 100;

type ObservationTab = "match" | "individual" | "all";

function filterByTab(observations: Observation[], tab: ObservationTab): Observation[] {
  if (tab === "all") return observations;
  if (tab === "match") return observations.filter((o) => o.observation_category === "match_player");
  return observations.filter((o) => o.observation_category === "individual");
}

export function ObservationsPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<ObservationTab>("all");
  const { data = [], total = 0, isLoading, isError, error } = useObservations({
    page,
    pageSize: PAGE_SIZE,
  });
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    source: "",
    rank: "",
    position: "",
    ratingMin: "",
    ratingMax: "",
    recommendation: "",
    formType: "",
  });
  const hasActiveFilters =
    filters.source ||
    filters.rank ||
    filters.position ||
    filters.ratingMin ||
    filters.ratingMax ||
    filters.recommendation ||
    filters.formType;

  const byTab = useMemo(() => filterByTab(data, tab), [data, tab]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return byTab;
    return byTab.filter((observation) => {
      const playerName = `${observation.player?.first_name ?? ""} ${observation.player?.last_name ?? ""}`.toLowerCase();
      const notes = observation.notes?.toLowerCase() ?? "";
      const summary = observation.summary?.toLowerCase() ?? "";
      const strengths = observation.strengths?.toLowerCase() ?? "";
      const weaknesses = observation.weaknesses?.toLowerCase() ?? "";
      const competition = observation.competition?.toLowerCase() ?? "";
      const source = observation.source?.toLowerCase() ?? "";
      const rank = observation.rank?.toLowerCase() ?? "";
      return (
        playerName.includes(query) ||
        notes.includes(query) ||
        summary.includes(query) ||
        strengths.includes(query) ||
        weaknesses.includes(query) ||
        competition.includes(query) ||
        source.includes(query) ||
        rank.includes(query)
      );
    });
  }, [byTab, search]);
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
      if (filters.recommendation && observation.recommendation !== filters.recommendation) return false;
      if (filters.formType && observation.form_type !== filters.formType) return false;
      return true;
    });
  }, [filtered, filters]);

  useEffect(() => {
    setPage(1);
  }, [search, tab, filters.source, filters.rank, filters.position, filters.ratingMin, filters.ratingMax, filters.recommendation, filters.formType]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Obserwacje"
        subtitle="Zarządzaj i przeglądaj raporty scoutingowe"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" />
                Nowa obserwacja
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/observations/match/new">Obserwacja meczowa</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/observations/new">Obserwacja indywidualna</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : "Nie udało się pobrać obserwacji."}
        </div>
      )}
      <Tabs value={tab} onValueChange={(v) => setTab(v as ObservationTab)}>
        <TabsList>
          <TabsTrigger value="match">Meczowe</TabsTrigger>
          <TabsTrigger value="individual">Indywidualne</TabsTrigger>
          <TabsTrigger value="all">Wszystkie</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-2" />
      </Tabs>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rekomendacja</label>
              <Select value={filters.recommendation} onValueChange={(value) => setFilters((prev) => ({ ...prev, recommendation: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dowolna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Pozytywna</SelectItem>
                  <SelectItem value="to_observe">Do obserwacji</SelectItem>
                  <SelectItem value="negative">Negatywna</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Typ formularza</label>
              <Select value={filters.formType} onValueChange={(value) => setFilters((prev) => ({ ...prev, formType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dowolny" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simplified">Uproszczony</SelectItem>
                  <SelectItem value="extended">Rozszerzony</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilters({ source: "", rank: "", position: "", ratingMin: "", ratingMax: "", recommendation: "", formType: "" })}
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
      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
