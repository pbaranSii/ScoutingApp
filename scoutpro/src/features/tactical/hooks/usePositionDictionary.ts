import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPosition,
  deactivatePosition,
  fetchPositionDictionary,
  updatePosition,
} from "../api/positionDictionary.api";
import type { PositionDictionaryInsert, PositionDictionaryUpdate } from "../types";

const POSITION_DICTIONARY_QUERY_KEY = ["tactical", "position-dictionary"];

export function usePositionDictionary(activeOnly = false) {
  return useQuery({
    queryKey: [...POSITION_DICTIONARY_QUERY_KEY, activeOnly],
    queryFn: () => fetchPositionDictionary(activeOnly),
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PositionDictionaryInsert) => createPosition(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: POSITION_DICTIONARY_QUERY_KEY }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PositionDictionaryUpdate }) =>
      updatePosition(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: POSITION_DICTIONARY_QUERY_KEY }),
  });
}

export function useDeactivatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivatePosition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: POSITION_DICTIONARY_QUERY_KEY }),
  });
}
