import { useState } from "react";
import { PipelineBoard } from "@/features/pipeline/components/PipelineBoard";
import {
  PipelineFiltersPanel,
  EMPTY_FILTERS,
  type PipelineFiltersState,
} from "@/features/pipeline/components/PipelineFiltersPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { SlidersHorizontal } from "lucide-react";

export function PipelinePage() {
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<PipelineFiltersState>(EMPTY_FILTERS);

  const hasActiveFilters =
    filters.status ||
    filters.birthYear ||
    filters.scoutId ||
    filters.position ||
    filters.clubId;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pipeline rekrutacyjny"
        subtitle="Zarządzaj statusami zawodników w procesie rekrutacji."
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Szukaj po nazwisku, imieniu lub klubie"
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
        <PipelineFiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setFiltersOpen(false)}
        />
      )}
      <PipelineBoard search={search} filters={filters} />
      <p className="text-center text-sm text-slate-500">
        Przeciągnij kartę zawodnika, aby zmienić jego status w pipeline.
      </p>
    </div>
  );
}
