import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFavoriteLists,
  createFavoriteList,
  updateFavoriteList,
  deleteFavoriteList,
  fetchFavoriteListById,
  type FavoriteListFilter,
} from "../api/favorites.api";
import type { FavoriteList } from "../types";

export function useFavoriteLists(filter: FavoriteListFilter = "mine") {
  return useQuery({
    queryKey: ["favorite-lists", filter],
    queryFn: () => fetchFavoriteLists(filter),
  });
}

export function useFavoriteList(id: string | null) {
  return useQuery({
    queryKey: ["favorite-list", id],
    queryFn: () => (id ? fetchFavoriteListById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useCreateFavoriteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string | null; formation?: string; region_id?: string | null }) =>
      createFavoriteList(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-lists"] });
    },
  });
}

export function useUpdateFavoriteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name?: string; description?: string | null; formation?: string; region_id?: string | null };
    }) => updateFavoriteList(id, input),
    onSuccess: (updated: FavoriteList) => {
      queryClient.invalidateQueries({ queryKey: ["favorite-lists"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-list", updated.id] });
    },
  });
}

export function useDeleteFavoriteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFavoriteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-lists"] });
    },
  });
}
