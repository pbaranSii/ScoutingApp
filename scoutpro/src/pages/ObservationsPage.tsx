import { useObservations } from "@/features/observations/hooks/useObservations";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
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
  const { data: profile } = useCurrentUserProfile();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<ObservationTab>("all");
  const { data = [], total = 0, isLoading, isError, error } = useObservations({
    page,
    pageSize: PAGE_SIZE,
    ...(profile?.business_role === "scout" && profile?.id ? { scoutId: profile.id } : {}),
  });
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    source: "",
    position: "",
    performanceMin: "",
    performanceMax: "",
    potentialFutureMin: "",
    potentialFutureMax: "",
    recommendation: "",
    formType: "",
    birthYearFrom: "",
    birthYearTo: "",
  });
  const hasActiveFilters =
    filters.source ||
    filters.position ||
    filters.performanceMin ||
    filters.performanceMax ||
    filters.potentialFutureMin ||
    filters.potentialFutureMax ||
    filters.recommendation ||
    filters.formType ||
    filters.birthYearFrom ||
    filters.birthYearTo;

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
      return (
        playerName.includes(query) ||
        notes.includes(query) ||
        summary.includes(query) ||
        strengths.includes(query) ||
        weaknesses.includes(query) ||
        competition.includes(query) ||
        source.includes(query)
      );
    });
  }, [byTab, search]);
  const filteredWithFilters = useMemo(() => {
    return filtered.filter((observation) => {
      if (filters.source && observation.source !== filters.source) return false;
      if (filters.position) {
        const normalized = mapLegacyPosition(observation.player?.primary_position ?? "");
        if (normalized !== filters.position) return false;
      }
      const performance = observation.potential_now;
      if (filters.performanceMin && (typeof performance !== "number" || performance < Number(filters.performanceMin))) {
        return false;
      }
      if (filters.performanceMax && (typeof performance !== "number" || performance > Number(filters.performanceMax))) {
        return false;
      }
      const potentialFuture = observation.potential_future;
      if (
        filters.potentialFutureMin &&
        (typeof potentialFuture !== "number" || potentialFuture < Number(filters.potentialFutureMin))
      ) {
        return false;
      }
      if (
        filters.potentialFutureMax &&
        (typeof potentialFuture !== "number" || potentialFuture > Number(filters.potentialFutureMax))
      ) {
        return false;
      }
      if (filters.recommendation && observation.recommendation !== filters.recommendation) return false;
      if (filters.formType && observation.form_type !== filters.formType) return false;
      const birthYear = observation.player?.birth_year;
      if (filters.birthYearFrom) {
        const from = Number(filters.birthYearFrom);
        if (!Number.isFinite(from) || typeof birthYear !== "number" || birthYear < from) return false;
      }
      if (filters.birthYearTo) {
        const to = Number(filters.birthYearTo);
        if (!Number.isFinite(to) || typeof birthYear !== "number" || birthYear > to) return false;
      }
      return true;
    });
  }, [filtered, filters]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    tab,
    filters.source,
    filters.position,
    filters.performanceMin,
    filters.performanceMax,
    filters.potentialFutureMin,
    filters.potentialFutureMax,
    filters.recommendation,
    filters.formType,
    filters.birthYearFrom,
    filters.birthYearTo,
  ]);

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
          <TabsTrigger value="all">Wszystkie</TabsTrigger>
          <TabsTrigger value="match">Meczowe</TabsTrigger>
          <TabsTrigger value="individual">Indywidualne</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-2" />
      </Tabs>
      <div className="flex flex-row items-center gap-2">
        <div className="relative min-w-0 flex-1">
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
          className="shrink-0 gap-2"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Źródło</label>
              <Select value={filters.source} onValueChange={(value) => setFilters((prev) => ({ ...prev, source: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Dowolne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scouting">Skauting</SelectItem>
                  <SelectItem value="referral">Polecenie</SelectItem>
                  <SelectItem value="application">Zgłoszenie</SelectItem>
                  <SelectItem value="trainer_report">Raport trenera</SelectItem>
                  <SelectItem value="scout_report">Raport skauta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
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
              <label className="text-sm font-medium text-slate-700">Performance (1–5)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={filters.performanceMin}
                  onChange={(event) => setFilters((prev) => ({ ...prev, performanceMin: event.target.value }))}
                  placeholder="min"
                />
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={filters.performanceMax}
                  onChange={(event) => setFilters((prev) => ({ ...prev, performanceMax: event.target.value }))}
                  placeholder="max"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Potencjał przyszły (1–5)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={filters.potentialFutureMin}
                  onChange={(event) => setFilters((prev) => ({ ...prev, potentialFutureMin: event.target.value }))}
                  placeholder="min"
                />
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={filters.potentialFutureMax}
                  onChange={(event) => setFilters((prev) => ({ ...prev, potentialFutureMax: event.target.value }))}
                  placeholder="max"
                />
              </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rocznik (od-do)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1950}
                  max={new Date().getFullYear()}
                  value={filters.birthYearFrom}
                  onChange={(event) => setFilters((prev) => ({ ...prev, birthYearFrom: event.target.value }))}
                  placeholder="od"
                />
                <Input
                  type="number"
                  min={1950}
                  max={new Date().getFullYear()}
                  value={filters.birthYearTo}
                  onChange={(event) => setFilters((prev) => ({ ...prev, birthYearTo: event.target.value }))}
                  placeholder="do"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFilters({
                  source: "",
                  position: "",
                  performanceMin: "",
                  performanceMax: "",
                  potentialFutureMin: "",
                  potentialFutureMax: "",
                  recommendation: "",
                  formType: "",
                  birthYearFrom: "",
                  birthYearTo: "",
                })
              }
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
