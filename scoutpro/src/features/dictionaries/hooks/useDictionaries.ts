import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DictionaryConfig } from "../config";
import {
  createDictionaryEntry,
  deleteDictionaryEntry,
  fetchDictionaryCount,
  fetchDictionaryEntries,
  toggleDictionaryEntryActive,
  updateDictionaryEntry,
} from "../api/dictionaries.api";
import { getDictionaryById } from "../config";

export function useDictionaryCounts() {
  return useQuery({
    queryKey: ["dictionary-counts"],
    queryFn: async () => {
      const { DICTIONARIES } = await import("../config");
      const counts = await Promise.all(
        DICTIONARIES.map(async (config) => {
          const { total, active } = await fetchDictionaryCount(config);
          return { id: config.id, config, total, active };
        })
      );
      return counts;
    },
  });
}

export function useDictionaryEntries(
  config: DictionaryConfig | null,
  options?: { activeOnly?: boolean; search?: string }
) {
  return useQuery({
    queryKey: ["dictionary-entries", config?.id, options?.activeOnly, options?.search],
    queryFn: () => fetchDictionaryEntries(config!, options),
    enabled: Boolean(config),
  });
}

export function useCreateDictionaryEntry(config: DictionaryConfig | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createDictionaryEntry(config!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dictionary-entries", config?.id] });
      queryClient.invalidateQueries({ queryKey: ["dictionary-counts"] });
    },
  });
}

export function useUpdateDictionaryEntry(config: DictionaryConfig | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateDictionaryEntry(config!, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dictionary-entries", config?.id] });
      queryClient.invalidateQueries({ queryKey: ["dictionary-counts"] });
    },
  });
}

export function useToggleDictionaryEntryActive(config: DictionaryConfig | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleDictionaryEntryActive(config!, id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dictionary-entries", config?.id] });
      queryClient.invalidateQueries({ queryKey: ["dictionary-counts"] });
    },
  });
}

export function useDeleteDictionaryEntry(config: DictionaryConfig | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDictionaryEntry(config!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dictionary-entries", config?.id] });
      queryClient.invalidateQueries({ queryKey: ["dictionary-counts"] });
    },
  });
}

/** Aktywne pozycje słownika Źródła pozyskania – do użycia w formularzu obserwacji (kontrolka Źródło). */
export function usePlayerSources() {
  const config = getDictionaryById("player_sources");
  return useDictionaryEntries(config ?? null, { activeOnly: true });
}

/** Lista województw – do wyboru w definicji klubu (opcjonalnie). */
export function useRegions() {
  const config = getDictionaryById("regions");
  return useDictionaryEntries(config ?? null, { activeOnly: true });
}

/** Aktywne pozycje słownika Mocne strony – do tagów w formularzu obserwacji. */
export function useStrengths() {
  const config = getDictionaryById("strengths");
  return useDictionaryEntries(config ?? null, { activeOnly: true });
}

/** Aktywne pozycje słownika Słabe strony – do tagów w formularzu obserwacji. */
export function useWeaknesses() {
  const config = getDictionaryById("weaknesses");
  return useDictionaryEntries(config ?? null, { activeOnly: true });
}
