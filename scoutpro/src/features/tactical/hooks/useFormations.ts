import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import {
  cloneFormation,
  createFormation,
  deleteFormation,
  fetchFormationById,
  fetchFormations,
  fetchDefaultFormation,
  replaceFormationSlots,
  setFormationDefault,
  updateFormation,
} from "../api/formations.api";
import type { FormationInsert, TacticalSlotInsert } from "../types";

const FORMATIONS_QUERY_KEY = ["tactical", "formations"];

export function useFormations() {
  return useQuery({
    queryKey: FORMATIONS_QUERY_KEY,
    queryFn: fetchFormations,
  });
}

export function useFormationById(id: string | null) {
  return useQuery({
    queryKey: [...FORMATIONS_QUERY_KEY, id],
    queryFn: () => (id ? fetchFormationById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useDefaultFormation() {
  return useQuery({
    queryKey: [...FORMATIONS_QUERY_KEY, "default"],
    queryFn: fetchDefaultFormation,
  });
}

export function useCreateFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      slots,
    }: {
      input: Omit<FormationInsert, "id">;
      slots?: Omit<TacticalSlotInsert, "id" | "formation_id">[];
    }) => createFormation(input, slots),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY }),
  });
}

export function useUpdateFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateFormation>[1];
    }) => updateFormation(id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...FORMATIONS_QUERY_KEY, id] });
    },
  });
}

export function useReplaceFormationSlots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      formationId,
      slots,
    }: {
      formationId: string;
      slots: Omit<TacticalSlotInsert, "id" | "formation_id">[];
    }) => replaceFormationSlots(formationId, slots),
    onSuccess: (_, { formationId }) => {
      qc.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...FORMATIONS_QUERY_KEY, formationId] });
    },
  });
}

export function useSetFormationDefault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setFormationDefault,
    onSuccess: () => qc.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY }),
  });
}

export function useCloneFormation() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: (sourceFormationId: string) =>
      cloneFormation(sourceFormationId, userId ?? null),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY }),
  });
}

export function useDeleteFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFormation,
    onSuccess: () => qc.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY }),
  });
}
