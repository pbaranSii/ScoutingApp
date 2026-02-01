import { supabase } from "@/lib/supabase";
import type { Observation, ObservationInput } from "../types";

export async function fetchObservations() {
  const { data, error } = await supabase
    .from("observations")
    .select("*, player:players(first_name,last_name,birth_year), scout:users(full_name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Observation[];
}

export async function createObservation(input: ObservationInput) {
  const { data, error } = await supabase
    .from("observations")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Observation;
}
