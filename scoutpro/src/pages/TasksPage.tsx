import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Plus } from "lucide-react";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { useUsers } from "@/features/users/hooks/useUsers";
import { TaskFilters, type TaskFilterStatus, type TaskFilterType } from "@/features/tasks/components/TaskFilters";
import { TaskList } from "@/features/tasks/components/TaskList";
import { CalendarView } from "@/features/tasks/components/CalendarView";
import { useDeleteTask, useUpdateTask } from "@/features/tasks/hooks/useTasks";
import type { TaskStatus } from "@/features/tasks/types";
import { toast } from "@/hooks/use-toast";

export function TasksPage() {
  const { data: tasks = [], isLoading, isError, error } = useTasks();
  const { data: users = [] } = useUsers();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [view, setView] = useState<"list" | "calendar">("list");
  const [filterStatus, setFilterStatus] = useState<TaskFilterStatus>("pending");
  const [filterType, setFilterType] = useState<TaskFilterType>("all");
  const [filterPerson, setFilterPerson] = useState<string>("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterStatus !== "all" && task.status !== filterStatus) return false;
      if (filterType !== "all" && task.type !== filterType) return false;
      if (filterPerson !== "all") {
        const matchAssigned = task.assigned_to === filterPerson;
        const matchCreated = task.created_by === filterPerson;
        if (!matchAssigned && !matchCreated) return false;
      }
      return true;
    });
  }, [tasks, filterStatus, filterType, filterPerson]);

  const personOptions = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((t) => {
      if (t.assigned_to) ids.add(t.assigned_to);
      if (t.created_by) ids.add(t.created_by);
    });
    return Array.from(ids)
      .map((id) => {
        const u = users.find((user) => user.id === id);
        return {
          id,
          label: u?.full_name?.trim() || u?.email || id,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tasks, users]);

  const hasActiveFilters =
    filterStatus !== "pending" || filterType !== "all" || filterPerson !== "all";

  const getUserName = useCallback(
    (userId: string) => {
      const u = users.find((user) => user.id === userId);
      return u?.full_name?.trim() || u?.email || null;
    },
    [users]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteTask.mutate(id, {
        onSuccess: () => {
          toast({ title: "Element został usunięty" });
        },
        onError: (err) => {
          toast({
            title: "Błąd",
            description: err instanceof Error ? err.message : "Nie udało się usunąć.",
            variant: "destructive",
          });
        },
      });
    },
    [deleteTask]
  );

  const handleClearFilters = useCallback(() => {
    setFilterStatus("pending");
    setFilterType("all");
    setFilterPerson("all");
    toast({ title: "Filtry zostały zresetowane" });
  }, []);

  const handleStatusChange = useCallback(
    (id: string, status: TaskStatus) => {
      updateTask.mutate(
        { id, payload: { status } },
        {
          onSuccess: () => {
            toast({ title: "Status zadania został zaktualizowany" });
          },
          onError: (err) => {
            toast({
              title: "Błąd",
              description: err instanceof Error ? err.message : "Nie udało się zmienić statusu.",
              variant: "destructive",
            });
          },
        }
      );
    },
    [updateTask]
  );

  const emptyMessage = hasActiveFilters
    ? "Brak zadań pasujących do wybranych filtrów"
    : "Brak zadań i zaproszeń";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Zadania i zaproszenia"
        subtitle="Zarządzaj zadaniami i zaproszeniami"
        actions={
          <Button asChild className="gap-2">
            <Link to="/tasks/new">
              <Plus className="h-4 w-4" />
              Dodaj nowy
            </Link>
          </Button>
        }
      />

      {isError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Nie udało się załadować zadań.</p>
          <p className="mt-1">
            {error instanceof Error ? error.message : "Nie udało się pobrać zadań."}
          </p>
          {(() => {
            const msg = error instanceof Error ? error.message : "";
            const code = (error as { code?: string } | null)?.code;
            const is404OrMissingTable =
              code === "PGRST204" ||
              msg.includes("404") ||
              msg.includes("Not Found") ||
              msg.toLowerCase().includes("relation") ||
              msg.toLowerCase().includes("does not exist");
            return is404OrMissingTable;
          })() ? (
            <div className="mt-3 rounded border border-amber-300 bg-amber-100/80 p-3 text-xs">
              <p className="font-semibold">Co zrobić (błąd 404 – tabela „tasks” niewidoczna w API):</p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>Wejdź na supabase.com → swój projekt (ten sam, z którego korzysta aplikacja).</li>
                <li>Project Settings (ikona zębatki) → zakładka API.</li>
                <li>Na dole strony kliknij <strong>Reload schema cache</strong>.</li>
                <li>Odśwież tę stronę (F5).</li>
              </ol>
              <p className="mt-2">
                Jeśli migracja zadań nie była jeszcze uruchomiona, w SQL Editor wykonaj plik{" "}
                <code className="rounded bg-amber-200 px-1">supabase/migrations/20260217100000_tasks_module.sql</code>.
              </p>
            </div>
          ) : null}
        </div>
      )}

      <TaskFilters
        view={view}
        onViewChange={setView}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterPerson={filterPerson}
        onFilterPersonChange={setFilterPerson}
        personOptions={personOptions}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {view === "list" && (
        <>
          {filteredTasks.length === 0 && !isLoading ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">{emptyMessage}</p>
              <Button asChild variant="outline" className="mt-3">
                <Link to="/tasks/new">Dodaj pierwszy element</Link>
              </Button>
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              isLoading={isLoading}
              getUserName={getUserName}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          )}
        </>
      )}

      {view === "calendar" && (
        <CalendarView
          tasks={filteredTasks}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
