import { supabase } from "@/lib/supabase";

export type EvaluationCriterion = {
  id: string;
  name: string;
  position_id: string;
  sort_order: number;
  weight: number;
};

/** Fetch evaluation criteria for a position by its code (e.g. CAM, GK). */
export async function fetchEvaluationCriteriaByPositionCode(
  positionCode: string
): Promise<EvaluationCriterion[]> {
  const { data: position, error: posError } = await supabase
    .from("positions")
    .select("id")
    .eq("code", positionCode)
    .maybeSingle();

  if (posError || !position) return [];

  const { data: criteria, error } = await supabase
    .from("evaluation_criteria")
    .select("id, name, position_id, sort_order, weight")
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
