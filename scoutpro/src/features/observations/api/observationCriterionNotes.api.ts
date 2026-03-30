import { supabase } from "@/lib/supabase";

export type ObservationCriterionNote = {
  id: string;
  observation_id: string;
  criteria_id: string;
  description: string | null;
  created_at: string;
};

export async function fetchObservationCriterionNotes(
  observationId: string
): Promise<{ criteria_id: string; description: string | null }[]> {
  const { data, error } = await supabase
    .from("observation_criterion_notes")
    .select("criteria_id, description")
    .eq("observation_id", observationId);
  if (error) throw error;
  return (data ?? []) as { criteria_id: string; description: string | null }[];
}

export async function replaceObservationCriterionNotes(
  observationId: string,
  notes: { criteria_id: string; description: string | null }[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("observation_criterion_notes")
    .delete()
    .eq("observation_id", observationId);
  if (deleteError) throw deleteError;
  if (notes.length === 0) return;
  const rows = notes.map((n) => ({
    observation_id: observationId,
    criteria_id: n.criteria_id,
    description: n.description,
  }));
  const { error: insertError } = await supabase.from("observation_criterion_notes").insert(rows);
  if (insertError) throw insertError;
}
