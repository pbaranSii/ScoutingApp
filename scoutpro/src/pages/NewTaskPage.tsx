import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { TaskForm } from "@/features/tasks/components/TaskForm";
import { useCreateTask, usePlayersForTask } from "@/features/tasks/hooks/useTasks";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useAuthStore } from "@/stores/authStore";
import { updatePlayerStatusWithHistory } from "@/features/players/api/players.api";
import { toast } from "@/hooks/use-toast";
import type { TaskFormData } from "@/features/tasks/types";

export function NewTaskPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: users = [] } = useUsers();
  const { data: players = [], isLoading: playersLoading } = usePlayersForTask();
  const createTask = useCreateTask();

  const handleSubmit = async (data: TaskFormData) => {
    if (!data.type) return;
    const createdBy = user?.id ?? "";
    if (!createdBy) {
      toast({
        title: "Błąd",
        description: "Musisz być zalogowany.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTask.mutateAsync({
        type: data.type,
        description: data.description.trim(),
        assigned_to: data.assigned_to || null,
        deadline: data.deadline,
        created_by: createdBy,
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
          data.type === "observation" && (data.selected_player_ids?.length ?? 0) > 0
            ? data.selected_player_ids
            : undefined,
      });

      if (
        data.type === "observation" &&
        data.selected_player_ids?.length &&
        user?.id
      ) {
        let done = 0;
        for (const playerId of data.selected_player_ids) {
          try {
            await updatePlayerStatusWithHistory({
              id: playerId,
              status: "observed",
              changed_by: user.id,
            });
            done++;
          } catch (e) {
            console.warn("Pipeline update for player", playerId, e);
          }
        }
        toast({
          title: "Obserwacja została dodana!",
          description: `Zawodnicy (${done}) zostali dodani do Pipeline w statusie "Observed".`,
        });
      } else if (data.type === "task") {
        toast({ title: "Zadanie zostało dodane!" });
      } else if (data.type === "invitation") {
        toast({ title: "Zaproszenie zostało dodane!" });
      } else {
        toast({ title: "Element został dodany!" });
      }

      navigate("/tasks");
    } catch (err) {
      toast({
        title: "Błąd",
        description: err instanceof Error ? err.message : "Nie udało się zapisać.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <PageHeader
        title="Dodaj element"
        subtitle="Nowe zadanie, zaproszenie lub obserwacja"
      />

      <TaskForm
        mode="create"
        users={users}
        players={players}
        playersLoading={playersLoading}
        onSubmit={handleSubmit}
        isSubmitting={createTask.isPending}
        onCancel={() => navigate("/tasks")}
      />
    </div>
  );
}
