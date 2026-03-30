import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTask,
  deleteTask,
  fetchTask,
  fetchTasks,
  updateTask,
} from "../api/tasks.api";
import type { CreateTaskPayload, UpdateTaskPayload } from "../api/tasks.api";
import { fetchPlayersForTask } from "@/features/players/api/players.api";

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => fetchTask(id!),
    enabled: Boolean(id),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      updateTask(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.removeQueries({ queryKey: ["task", id] });
    },
  });
}

export function usePlayersForTask() {
  return useQuery({
    queryKey: ["players-for-task"],
    queryFn: fetchPlayersForTask,
  });
}
