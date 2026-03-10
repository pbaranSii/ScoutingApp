import { useEffect, useState } from "react";
import { usePlayers } from "@/features/players/hooks/usePlayers";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { PlayerList } from "@/features/players/components/PlayerList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_PIPELINE_STATUSES, type PipelineStatus } from "@/features/pipeline/types";
import { POSITION_OPTIONS } from "@/features/players/positions";
import { SlidersHorizontal } from "lucide-react";

const PAGE_SIZE = 100;

export function PlayersPage() {
  const { data: profile } = useCurrentUserProfile();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    position: "",
    status: "",
    birthYear: "",
    birthYearFrom: "",
    birthYearTo: "",
    contractEndBefore: "",
    recommendation: "",
    performanceMin: "",
    performanceMax: "",
  });
  const hasActiveFilters =
    filters.position ||
    filters.status ||
    filters.birthYear ||
    filters.birthYearFrom ||
    filters.birthYearTo ||
    filters.contractEndBefore ||
    filters.recommendation ||
    filters.performanceMin ||
    filters.performanceMax;

  const { data = [], total = 0, isLoading } = usePlayers({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
    primary_position: filters.position || undefined,
    status: (filters.status || undefined) as PipelineStatus | undefined,
    birthYear: filters.birthYear ? Number(filters.birthYear) : undefined,
    birthYearFrom: filters.birthYearFrom ? Number(filters.birthYearFrom) : undefined,
    birthYearTo: filters.birthYearTo ? Number(filters.birthYearTo) : undefined,
    contractEndBefore: filters.contractEndBefore || undefined,
    recommendation: (filters.recommendation || undefined) as "positive" | "to_observe" | "negative" | undefined,
    performanceMin: filters.performanceMin ? Number(filters.performanceMin) : undefined,
    performanceMax: filters.performanceMax ? Number(filters.performanceMax) : undefined,
    ...(profile?.business_role === "scout" && profile?.id ? { createdBy: profile.id } : {}),
  });

  useEffect(() => {
    setPage(1);
  }, [
    search,
    filters.position,
    filters.status,
    filters.birthYear,
    filters.birthYearFrom,
    filters.birthYearTo,
    filters.contractEndBefore,
    filters.recommendation,
    filters.performanceMin,
    filters.performanceMax,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

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
                  {ALL_PIPELINE_STATUSES.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
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
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Rocznik od – do</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={filters.birthYearFrom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, birthYearFrom: e.target.value }))}
                  placeholder="od (np. 2005)"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  value={filters.birthYearTo}
                  onChange={(e) => setFilters((prev) => ({ ...prev, birthYearTo: e.target.value }))}
                  placeholder="do (np. 2010)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Kontrakt kończy się przed</label>
              <Input
                type="date"
                value={filters.contractEndBefore}
                onChange={(e) => setFilters((prev) => ({ ...prev, contractEndBefore: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rekomendacja (ostatnia obserwacja)</label>
              <Select
                value={filters.recommendation}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, recommendation: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Dowolna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Dowolna</SelectItem>
                  <SelectItem value="positive">Pozytywna</SelectItem>
                  <SelectItem value="to_observe">Do obserwacji</SelectItem>
                  <SelectItem value="negative">Negatywna</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Performance (ostatnia obserwacja, 1–5)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  inputMode="numeric"
                  value={filters.performanceMin}
                  onChange={(e) => setFilters((prev) => ({ ...prev, performanceMin: e.target.value }))}
                  placeholder="min"
                />
                <Input
                  type="number"
                  min={1}
                  max={5}
                  inputMode="numeric"
                  value={filters.performanceMax}
                  onChange={(e) => setFilters((prev) => ({ ...prev, performanceMax: e.target.value }))}
                  placeholder="max"
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
                  position: "",
                  status: "",
                  birthYear: "",
                  birthYearFrom: "",
                  birthYearTo: "",
                  contractEndBefore: "",
                  recommendation: "",
                  performanceMin: "",
                  performanceMax: "",
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

      <PlayerList players={data} isLoading={isLoading} />
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
