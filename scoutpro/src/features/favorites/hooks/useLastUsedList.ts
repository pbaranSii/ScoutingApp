import { useQuery } from "@tanstack/react-query";
import { fetchLastUsedListId } from "../api/favorites.api";

export function useLastUsedListId() {
  return useQuery({
    queryKey: ["last-used-favorite-list"],
    queryFn: fetchLastUsedListId,
  });
}
