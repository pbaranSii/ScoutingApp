import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

export type CriterionSection = Database["public"]["Enums"]["criterion_section"];

export type EvaluationCriterion = {
  id: string;
  name: string;
  position_id: string;
  sort_order: number;
  weight: number;
  section?: CriterionSection | null;
  code?: string | null;
};

/** Map position_dictionary position_code to positions table code (e.g. DM->CDM, AM->CAM). */
function positionCodeToPositionsTableCode(code: string): string {
  const trimmed = code?.trim() || "";
  const map: Record<string, string> = { DM: "CDM", AM: "CAM" };
  return map[trimmed] ?? trimmed;
}

/** Fetch evaluation criteria for a position by its code (e.g. CAM, GK, DM from position_dictionary). Includes section/code for extended form. */
export async function fetchEvaluationCriteriaByPositionCode(
  positionCode: string
): Promise<EvaluationCriterion[]> {
  const codeToUse = positionCodeToPositionsTableCode(positionCode);
  if (!codeToUse) return [];

  const { data: position, error: posError } = await supabase
    .from("positions")
    .select("id")
    .eq("code", codeToUse)
    .maybeSingle();

  if (posError || !position) return [];

  const { data: criteria, error } = await supabase
    .from("evaluation_criteria")
    .select("id, name, position_id, sort_order, weight, section, code")
    .eq("position_id", position.id)
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
