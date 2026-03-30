import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPositionFormTemplate,
  deletePositionFormTemplate,
  fetchPositionFormTemplateById,
  fetchPositionFormTemplateElements,
  fetchPositionFormTemplates,
  fetchEvaluationCriteriaPool,
  setPositionFormTemplateElements,
  updatePositionFormTemplate,
  createTemplateFromPosition,
} from "../api/positionFormTemplate.api";
import type { PositionFormTemplateInsert, PositionFormTemplateUpdate } from "../api/positionFormTemplate.api";

export const FORM_TEMPLATES_QUERY_KEY = ["tactical", "form-templates"];

export function usePositionFormTemplates() {
  return useQuery({
    queryKey: FORM_TEMPLATES_QUERY_KEY,
    queryFn: () => fetchPositionFormTemplates(),
  });
}

export function usePositionFormTemplate(id: string | null) {
  return useQuery({
    queryKey: [...FORM_TEMPLATES_QUERY_KEY, id],
    queryFn: () => fetchPositionFormTemplateById(id!),
    enabled: Boolean(id),
  });
}

export function usePositionFormTemplateElements(templateId: string | null) {
  return useQuery({
    queryKey: [...FORM_TEMPLATES_QUERY_KEY, templateId, "elements"],
    queryFn: () => fetchPositionFormTemplateElements(templateId!),
    enabled: Boolean(templateId),
  });
}

export function useEvaluationCriteriaPool() {
  return useQuery({
    queryKey: ["tactical", "evaluation-criteria-pool"],
    queryFn: () => fetchEvaluationCriteriaPool(),
  });
}

export function useCreatePositionFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<PositionFormTemplateInsert, "id" | "created_at" | "updated_at">) =>
      createPositionFormTemplate(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORM_TEMPLATES_QUERY_KEY }),
  });
}

export function useUpdatePositionFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PositionFormTemplateUpdate }) =>
      updatePositionFormTemplate(id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: FORM_TEMPLATES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...FORM_TEMPLATES_QUERY_KEY, id] });
    },
  });
}

export function useDeletePositionFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePositionFormTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORM_TEMPLATES_QUERY_KEY }),
  });
}

export function useSetPositionFormTemplateElements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      elements,
    }: {
      templateId: string;
      elements: (
        | { element_type: "header"; sort_order: number; header_label: string }
        | { element_type: "criterion"; sort_order: number; evaluation_criterion_id: string; is_required: boolean }
      )[];
    }) => setPositionFormTemplateElements(templateId, elements),
    onSuccess: (_, { templateId }) => {
      qc.invalidateQueries({ queryKey: FORM_TEMPLATES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...FORM_TEMPLATES_QUERY_KEY, templateId, "elements"] });
    },
  });
}

export function useCreateTemplateFromPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateName, positionId }: { templateName: string; positionId: string }) =>
      createTemplateFromPosition(templateName, positionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: FORM_TEMPLATES_QUERY_KEY }),
  });
}
