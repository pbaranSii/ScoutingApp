import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type CriterionSection = Database["public"]["Enums"]["criterion_section"];

export type EvaluationCriterion = {
  id: string;
  name: string;
  position_dictionary_id: string;
  sort_order: number;
  weight: number;
  section?: CriterionSection | null;
  code?: string | null;
  is_required?: boolean;
};

/** One element in observation form 4b: header or criterion. */
export type ObservationFormElement =
  | { type: "header"; label: string }
  | { type: "criterion"; criterion: EvaluationCriterion };

const SECTION_LABELS: Record<string, string> = {
  defense: "DEFENSYWA — BRONIENIE",
  offense: "OFENSYWA — POSIADANIE PIŁKI",
  transition_oa: "FAZA PRZEJŚCIOWA O→A",
  transition_ao: "FAZA PRZEJŚCIOWA A→O",
};

/** Fetch form elements for section 4b. With form_template_id returns headers + criteria in template order; else criteria with default section headers. */
export async function fetchCriteriaForObservationForm(
  positionCode: string
): Promise<ObservationFormElement[]> {
  const code = positionCode?.trim() || "";
  if (!code) return [];

  const { data: positionRow, error: posError } = await supabase
    .from("position_dictionary")
    .select("id, criteria_template_position_id, form_template_id")
    .eq("position_code", code)
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (posError || !positionRow) return [];
  const formTemplateId = (positionRow as { form_template_id?: string | null }).form_template_id;
  if (formTemplateId) {
    const { data: elements, error: elError } = await supabase
      .from("position_form_template_element")
      .select("element_type, sort_order, header_label, evaluation_criterion_id, is_required")
      .eq("template_id", formTemplateId)
      .order("sort_order", { ascending: true });
    if (elError || !elements?.length) return [];
    const criterionIds = elements
      .filter((e) => e.element_type === "criterion" && e.evaluation_criterion_id)
      .map((e) => e.evaluation_criterion_id!);
    let criteriaMap = new Map<string, EvaluationCriterion>();
    if (criterionIds.length > 0) {
      const { data: criteria, error: critError } = await supabase
        .from("evaluation_criteria")
        .select("id, name, position_dictionary_id, sort_order, weight, section, code, is_required")
        .in("id", criterionIds);
      if (critError) return [];
      criteriaMap = new Map((criteria ?? []).map((c) => [c.id, { ...c, is_required: false } as EvaluationCriterion]));
    }
    const result: ObservationFormElement[] = [];
    for (const el of elements) {
      if (el.element_type === "header") {
        result.push({ type: "header", label: el.header_label?.trim() ?? "" });
        continue;
      }
      const c = el.evaluation_criterion_id ? criteriaMap.get(el.evaluation_criterion_id) : null;
      if (c)
        result.push({
          type: "criterion",
          criterion: { ...c, is_required: el.is_required ?? false, sort_order: el.sort_order },
        });
    }
    return result;
  }
  const criteria = await fetchEvaluationCriteriaByPositionCode(code);
  if (criteria.length === 0) return [];
  const bySection = new Map<CriterionSection | null, EvaluationCriterion[]>();
  for (const c of criteria) {
    const sec = c.section ?? null;
    const arr = bySection.get(sec) ?? [];
    arr.push(c);
    bySection.set(sec, arr);
  }
  const order: (CriterionSection | null)[] = ["defense", "offense", "transition_oa", "transition_ao", null];
  const out: ObservationFormElement[] = [];
  for (const sec of order) {
    const arr = bySection.get(sec) ?? [];
    if (arr.length === 0) continue;
    const label = sec ? SECTION_LABELS[sec] ?? sec : "Inne";
    // For transition sections, do not emit a header – only criteria with names
    if (sec !== "transition_oa" && sec !== "transition_ao") {
      out.push({ type: "header", label });
    }
    for (const c of arr) out.push({ type: "criterion", criterion: c });
  }
  return out;
}

/** Fetch evaluation criteria for a position by its code. Uses criteria_template_position_id when set; else LCB/RCB→CB, RCM/LCM→CM fallback. */
export async function fetchEvaluationCriteriaByPositionCode(
  positionCode: string
): Promise<EvaluationCriterion[]> {
  const code = positionCode?.trim() || "";
  if (!code) return [];

  let lookupCode = code;
  if (code === "LCB" || code === "RCB") lookupCode = "CB";
  if (code === "RCM" || code === "LCM") lookupCode = "CM";

  const { data: positionByCode, error: codeError } = await supabase
    .from("position_dictionary")
    .select("id, criteria_template_position_id")
    .eq("position_code", code)
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (codeError) return [];

  let positionId: string;
  if (positionByCode?.criteria_template_position_id) {
    positionId = positionByCode.criteria_template_position_id;
  } else if (positionByCode?.id && lookupCode === code) {
    positionId = positionByCode.id;
  } else {
    // No template and code has a known fallback (LCB/RCB→CB, RCM/LCM→CM), or no row for code
    const { data: positionByLookup, error: lookupError } = await supabase
      .from("position_dictionary")
      .select("id")
      .eq("position_code", lookupCode)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (lookupError || !positionByLookup) {
      if (positionByCode?.id) positionId = positionByCode.id;
      else return [];
    } else {
      positionId = positionByLookup.id;
    }
  }

  const { data: criteria, error } = await supabase
    .from("evaluation_criteria")
    .select("id, name, position_dictionary_id, sort_order, weight, section, code, is_required")
    .eq("position_dictionary_id", positionId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (criteria ?? []) as EvaluationCriterion[];
}

/** Fetch existing player evaluation scores for an observation (for edit prefill). */
export async function fetchPlayerEvaluationsByObservation(
  observationId: string
): Promise<{ criteria_id: string; score: number }[]> {
  const { data, error } = await supabase
    .from("player_evaluations")
    .select("criteria_id, score")
    .eq("observation_id", observationId);
  if (error) return [];
  return (data ?? []) as { criteria_id: string; score: number }[];
}

/** Save player evaluation scores for an observation. */
export async function savePlayerEvaluations(
  observationId: string,
  scores: { criteria_id: string; score: number }[]
): Promise<void> {
  if (scores.length === 0) return;
  const rows = scores.map((s) => ({
    observation_id: observationId,
    criteria_id: s.criteria_id,
    score: Math.min(5, Math.max(1, s.score)),
  }));
  const { error } = await supabase.from("player_evaluations").insert(rows);
  if (error) throw error;
}

/** Replace all position evaluations for an observation (delete existing, then insert). Used in edit. */
export async function replacePlayerEvaluations(
  observationId: string,
  scores: { criteria_id: string; score: number }[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("player_evaluations")
    .delete()
    .eq("observation_id", observationId);
  if (deleteError) throw deleteError;
  if (scores.length > 0) {
    await savePlayerEvaluations(observationId, scores);
  }
}
