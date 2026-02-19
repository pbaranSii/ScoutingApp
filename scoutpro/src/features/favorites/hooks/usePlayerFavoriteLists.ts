import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchListsContainingPlayer, countListsContainingPlayer } from "../api/favorites.api";

export function usePlayerFavoriteLists(playerId: string | null) {
  return useQuery({
    queryKey: ["player-favorite-lists", playerId],
    queryFn: () => (playerId ? fetchListsContainingPlayer(playerId) : Promise.resolve([])),
    enabled: Boolean(playerId),
  });
}

export function usePlayerFavoriteListsCount(playerId: string | null) {
  return useQuery({
    queryKey: ["player-favorite-lists-count", playerId],
    queryFn: () => (playerId ? countListsContainingPlayer(playerId) : Promise.resolve(0)),
    enabled: Boolean(playerId),
  });
}

export function useInvalidatePlayerFavoriteLists() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["player-favorite-lists"] });
    queryClient.invalidateQueries({ queryKey: ["player-favorite-lists-count"] });
  };
}
