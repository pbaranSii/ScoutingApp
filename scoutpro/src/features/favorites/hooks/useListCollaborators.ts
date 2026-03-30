import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchListCollaborators, addCollaborator, removeCollaborator } from "../api/favorites.api";

export function useListCollaborators(listId: string | null) {
  return useQuery({
    queryKey: ["favorite-list-collaborators", listId],
    queryFn: () => (listId ? fetchListCollaborators(listId) : Promise.resolve([])),
    enabled: Boolean(listId),
  });
}

export function useAddCollaborator(listId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => (listId ? addCollaborator(listId, userId) : Promise.reject(new Error("No list"))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-list-collaborators", listId] });
      queryClient.invalidateQueries({ queryKey: ["favorite-list", listId] });
    },
  });
}

export function useRemoveCollaborator(listId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      listId ? removeCollaborator(listId, userId) : Promise.reject(new Error("No list")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-list-collaborators", listId] });
      queryClient.invalidateQueries({ queryKey: ["favorite-list", listId] });
    },
  });
}
