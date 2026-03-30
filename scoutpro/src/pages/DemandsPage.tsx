import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayerDemands, useDeletePlayerDemand } from "@/features/demands/hooks";
import type { PlayerDemandFilters, DemandPriority, DemandStatus } from "@/features/demands/types";
import { DemandCard } from "@/features/demands/components/DemandCard";
import { useClubs } from "@/features/players/hooks/usePlayers";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { PlayerDemand } from "@/features/demands/types";

const CAN_MANAGE_ROLES = ["director", "coach", "admin"] as const;

export function DemandsPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<PlayerDemandFilters>({});
  const { data: demands = [], isLoading, isError, error } = usePlayerDemands(filters);
  const hasActiveFilters = Boolean(
    filters.clubId ?? filters.season ?? filters.position ?? filters.priority ?? filters.status
  );
  const { data: clubs = [] } = useClubs();
  const { data: profile } = useCurrentUserProfile();
  const deleteDemand = useDeletePlayerDemand();

  const canManage = useMemo(
    () => profile?.business_role && CAN_MANAGE_ROLES.includes(profile.business_role as (typeof CAN_MANAGE_ROLES)[number]),
    [profile?.business_role]
  );

  const handleDelete = async (demand: PlayerDemand) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć zapotrzebowanie (${demand.position} ${demand.season})?`)) return;
    try {
      await deleteDemand.mutateAsync(demand.id);
      toast({ title: "Zapotrzebowanie usunięte" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się usunąć.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Zapotrzebowania"
        subtitle="Lista zapotrzebowań na zawodników według klubu, sezonu i pozycji"
        actions={
          canManage ? (
            <Button asChild className="gap-2">
              <Link to="/demands/new">
                <Plus className="h-4 w-4" />
                Nowe zapotrzebowanie
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2"
          onClick={() => setFiltersOpen((prev) => !prev)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtry
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-slate-900 px-2 text-[11px] text-white">aktywne</span>
          )}
        </Button>
      </div>
      {filtersOpen && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Klub</label>
              <Select
                value={filters.clubId ?? "all"}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, clubId: v === "all" ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie kluby" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie kluby</SelectItem>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sezon</label>
              <Select
                value={filters.season ?? "all"}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, season: v === "all" ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie sezony" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie sezony</SelectItem>
                  {Array.from(new Set(demands.map((d) => d.season))).sort().map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Pozycja</label>
              <Select
                value={filters.position ?? "all"}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, position: v === "all" ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie pozycje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie pozycje</SelectItem>
                  {Array.from(new Set(demands.map((d) => d.position))).sort().map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Priorytet</label>
              <Select
                value={filters.priority ?? "all"}
                onValueChange={(v) =>
                  setFilters((prev) => ({ ...prev, priority: v === "all" ? undefined : (v as DemandPriority) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="critical">Krytyczny</SelectItem>
                  <SelectItem value="high">Wysoki</SelectItem>
                  <SelectItem value="standard">Standardowy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(v) =>
                  setFilters((prev) => ({ ...prev, status: v === "all" ? undefined : (v as DemandStatus) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="open">Otwarte</SelectItem>
                  <SelectItem value="in_progress">W trakcie</SelectItem>
                  <SelectItem value="filled">Wypełnione</SelectItem>
                  <SelectItem value="cancelled">Anulowane</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-slate-500">Ładowanie…</p>}
      {isError && (
        <p className="text-sm text-red-600">
          Błąd: {error instanceof Error ? error.message : "Nie udało się załadować zapotrzebowań."}
        </p>
      )}
      {!isLoading && !isError && demands.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">
          <p className="font-medium">Brak zapotrzebowań.</p>
          <p className="mt-1 text-sm">
            {canManage
              ? "Utwórz pierwsze zapotrzebowanie, aby określić potrzeby rekrutacyjne."
              : "Zapotrzebowania pojawią się tutaj po ich utworzeniu przez dyrektora lub trenera."}
          </p>
          {canManage && (
            <Button asChild className="mt-4">
              <Link to="/demands/new">Utwórz zapotrzebowanie</Link>
            </Button>
          )}
        </div>
      )}
      {!isLoading && !isError && demands.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demands.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              canManage={canManage}
              onDelete={canManage ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
