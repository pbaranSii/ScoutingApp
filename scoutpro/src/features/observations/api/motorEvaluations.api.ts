import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type MotorEvaluationRow = Database["public"]["Tables"]["motor_evaluations"]["Row"];
type MotorEvaluationInsert = Database["public"]["Tables"]["motor_evaluations"]["Insert"];

export type MotorEvaluation = MotorEvaluationRow;

export type MotorEvaluationInput = {
  observation_id: string;
  speed: number;
  endurance: number;
  jumping: number;
  agility: number;
  acceleration: number;
  strength: number;
  description?: string | null;
};

export async function fetchMotorEvaluationByObservation(
  observationId: string
): Promise<MotorEvaluation | null> {
  const { data, error } = await supabase
    .from("motor_evaluations")
    .select("*")
    .eq("observation_id", observationId)
    .maybeSingle();
  if (error) throw error;
  return data as MotorEvaluation | null;
}

export async function upsertMotorEvaluation(input: MotorEvaluationInput): Promise<MotorEvaluation> {
  const row: MotorEvaluationInsert = {
    observation_id: input.observation_id,
    speed: Math.min(5, Math.max(1, input.speed)),
    endurance: Math.min(5, Math.max(1, input.endurance)),
    jumping: Math.min(5, Math.max(1, input.jumping)),
    agility: Math.min(5, Math.max(1, input.agility)),
    acceleration: Math.min(5, Math.max(1, input.acceleration)),
    strength: Math.min(5, Math.max(1, input.strength)),
    description: input.description ?? null,
  };
  const { data, error } = await supabase
    .from("motor_evaluations")
    .upsert(row, { onConflict: "observation_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as MotorEvaluation;
}
