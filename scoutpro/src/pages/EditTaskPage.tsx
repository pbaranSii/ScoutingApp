import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { TaskForm } from "@/features/tasks/components/TaskForm";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  usePlayersForTask,
} from "@/features/tasks/hooks/useTasks";
import { useUsers } from "@/features/users/hooks/useUsers";
import { toast } from "@/hooks/use-toast";
import type { TaskFormData } from "@/features/tasks/types";
import { Trash2 } from "lucide-react";

export function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading: taskLoading } = useTask(id);
  const { data: users = [] } = useUsers();
  const { data: players = [], isLoading: playersLoading } = usePlayersForTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleSubmit = async (data: TaskFormData) => {
    if (!id) return;
    try {
      await updateTask.mutateAsync({
        id,
        payload: {
          description: data.description.trim(),
          assigned_to: data.assigned_to || null,
          deadline: data.deadline,
          status: data.status ?? undefined,
          location: data.type === "invitation" ? data.location || null : undefined,
          meeting_date: data.type === "invitation" ? data.meeting_date || null : undefined,
          inviter_info: data.type === "invitation" ? data.inviter_info || null : undefined,
          observation_location:
            data.type === "observation" ? data.observation_location || null : undefined,
          observation_date:
            data.type === "observation" ? data.observation_date || null : undefined,
          observation_source:
            data.type === "observation" ? data.observation_source || null : undefined,
          player_ids:
            data.type === "observation" ? data.selected_player_ids : undefined,
        },
      });
      toast({ title: "Element został zaktualizowany!" });
      navigate("/tasks");
    } catch (err) {
      toast({
        title: "Błąd",
        description: err instanceof Error ? err.message : "Nie udało się zapisać.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;
    if (!window.confirm("Czy na pewno chcesz usunąć ten element?")) return;
    deleteTask.mutate(id, {
      onSuccess: () => {
        toast({ title: "Element został usunięty" });
        navigate("/tasks");
      },
      onError: (err) => {
        toast({
          title: "Błąd",
          description: err instanceof Error ? err.message : "Nie udało się usunąć.",
          variant: "destructive",
        });
      },
    });
  };

  if (taskLoading || !task) {
    return (
      <div className="mx-auto w-full max-w-[960px]">
        <p className="text-sm text-slate-500">
          {taskLoading ? "Ładowanie..." : "Nie znaleziono elementu."}
        </p>
      </div>
    );
  }

  const toDateTimeLocal = (iso: string | null | undefined) => {
    if (!iso) return "";
    try {
      return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  };
  const initialData: Partial<TaskFormData> & { player_ids?: string[] } = {
    type: task.type,
    description: task.description,
    assigned_to: task.assigned_to ?? "",
    deadline: task.deadline,
    status: task.status ?? "pending",
    location: task.location ?? "",
    meeting_date: toDateTimeLocal(task.meeting_date),
    inviter_info: task.inviter_info ?? "",
    observation_location: task.observation_location ?? "",
    observation_date: toDateTimeLocal(task.observation_date),
    observation_source: task.observation_source ?? "",
    player_ids: task.player_ids ?? [],
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <PageHeader
        title="Edytuj element"
        subtitle="Modyfikacja zadania, zaproszenia lub obserwacji"
        actions={
          <Button
            type="button"
            variant="outline"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleDelete}
            disabled={deleteTask.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń
          </Button>
        }
      />

      <TaskForm
        mode="edit"
        initialData={initialData}
        users={users}
        players={players}
        playersLoading={playersLoading}
        onSubmit={handleSubmit}
        isSubmitting={updateTask.isPending}
        onCancel={() => navigate("/tasks")}
      />
    </div>
  );
}
