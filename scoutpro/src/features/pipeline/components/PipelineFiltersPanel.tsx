import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_PIPELINE_STATUSES } from "../types";
import { AGE_CATEGORY_FILTER_OPTIONS } from "../utils/ageCategory";
import { POSITION_OPTIONS } from "@/features/players/positions";
import { useClubs } from "@/features/players/hooks/usePlayers";
import { useScouts } from "@/features/users/hooks/useUsers";

export type PipelineFiltersState = {
  status: string;
  birthYear: string;
  scoutId: string;
  position: string;
  clubId: string;
};

const EMPTY_FILTERS: PipelineFiltersState = {
  status: "",
  birthYear: "",
  scoutId: "",
  position: "",
  clubId: "",
};

type PipelineFiltersPanelProps = {
  filters: PipelineFiltersState;
  onFiltersChange: (f: PipelineFiltersState) => void;
  onClose: () => void;
};

export function PipelineFiltersPanel({
  filters,
  onFiltersChange,
  onClose,
}: PipelineFiltersPanelProps) {
  const { data: clubs = [] } = useClubs();
  const { data: scouts = [] } = useScouts();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Dowolny" />
            </SelectTrigger>
            <SelectContent>
              {ALL_PIPELINE_STATUSES.filter((s) => s.id !== "unassigned").map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Kategoria wiekowa</label>
          <Select
            value={filters.birthYear}
            onValueChange={(value) => onFiltersChange({ ...filters, birthYear: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Dowolna" />
            </SelectTrigger>
            <SelectContent>
              {AGE_CATEGORY_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">Scout</label>
          <Select
            value={filters.scoutId}
            onValueChange={(value) => onFiltersChange({ ...filters, scoutId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Dowolny" />
            </SelectTrigger>
            <SelectContent>
              {scouts.map((scout) => (
                <SelectItem key={scout.id} value={scout.id}>
                  {scout.full_name?.trim() || scout.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Pozycja</label>
          <Select
            value={filters.position}
            onValueChange={(value) => onFiltersChange({ ...filters, position: value })}
          >
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
          <label className="text-sm font-medium text-slate-700">Klub</label>
          <Select
            value={filters.clubId}
            onValueChange={(value) => onFiltersChange({ ...filters, clubId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Dowolny" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onFiltersChange(EMPTY_FILTERS)}
        >
          Wyczyść
        </Button>
        <Button type="button" onClick={onClose}>
          Zastosuj
        </Button>
      </div>
    </div>
  );
}

export { EMPTY_FILTERS };
