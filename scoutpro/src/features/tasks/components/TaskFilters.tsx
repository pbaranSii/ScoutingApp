import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { List, CalendarDays } from "lucide-react";
import type { TaskStatus, TaskType } from "../types";
import { TASK_TYPE_LABELS, TASK_STATUS_LABELS } from "../types";

export type TaskFilterType = "all" | TaskType;
export type TaskFilterStatus = "all" | TaskStatus;

type TaskFiltersProps = {
  view: "list" | "calendar";
  onViewChange: (view: "list" | "calendar") => void;
  filterStatus: TaskFilterStatus;
  onFilterStatusChange: (value: TaskFilterStatus) => void;
  filterType: TaskFilterType;
  onFilterTypeChange: (value: TaskFilterType) => void;
  filterPerson: string;
  onFilterPersonChange: (value: string) => void;
  personOptions: { id: string; label: string }[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export function TaskFilters({
  view,
  onViewChange,
  filterStatus,
  onFilterStatusChange,
  filterType,
  onFilterTypeChange,
  filterPerson,
  onFilterPersonChange,
  personOptions,
  hasActiveFilters,
  onClearFilters,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant={view === "list" ? "default" : "outline"}
          className="h-10 px-3 text-sm"
          onClick={() => onViewChange("list")}
        >
          <List className="mr-1 h-4 w-4" />
          Lista
        </Button>
        <Button
          variant={view === "calendar" ? "default" : "outline"}
          className="h-10 px-3 text-sm"
          onClick={() => onViewChange("calendar")}
        >
          <CalendarDays className="mr-1 h-4 w-4" />
          Kalendarz
        </Button>
      </div>

      <Select
        value={filterStatus}
        onValueChange={(v) => onFilterStatusChange(v as TaskFilterStatus)}
      >
        <SelectTrigger className="h-10 w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie</SelectItem>
          {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(
            ([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      <Select
        value={filterType}
        onValueChange={(v) => onFilterTypeChange(v as TaskFilterType)}
      >
        <SelectTrigger className="h-10 w-[180px]">
          <SelectValue placeholder="Typ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie typy</SelectItem>
          {(Object.entries(TASK_TYPE_LABELS) as [TaskType, string][]).map(
            ([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      <Select value={filterPerson} onValueChange={onFilterPersonChange}>
        <SelectTrigger className="h-10 w-[200px]">
          <SelectValue placeholder="Osoba" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie osoby</SelectItem>
          {personOptions.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          className="h-10 px-3 text-sm"
          onClick={onClearFilters}
        >
          Wyczyść filtry
        </Button>
      )}
    </div>
  );
}
