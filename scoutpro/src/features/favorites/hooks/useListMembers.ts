import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchListMembersWithRating,
  addPlayerToList,
  removePlayerFromList,
} from "../api/favorites.api";

export function useListMembers(listId: string | null) {
  return useQuery({
    queryKey: ["favorite-list-members", listId],
    queryFn: () => (listId ? fetchListMembersWithRating(listId) : Promise.resolve([])),
    enabled: Boolean(listId),
  });
}

export function useAddPlayerToList(listId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => (listId ? addPlayerToList(listId, playerId) : Promise.reject(new Error("No list"))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-list-members", listId] });
      queryClient.invalidateQueries({ queryKey: ["favorite-lists"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-list", listId] });
      queryClient.invalidateQueries({ queryKey: ["player-favorite-lists"] });
    },
  });
}

export function useRemovePlayerFromList(listId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) =>
      listId ? removePlayerFromList(listId, playerId) : Promise.reject(new Error("No list")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-list-members", listId] });
      queryClient.invalidateQueries({ queryKey: ["favorite-lists"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-list", listId] });
      queryClient.invalidateQueries({ queryKey: ["player-favorite-lists"] });
    },
  });
}
