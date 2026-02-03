import { supabase } from "@/lib/supabase";
import type { Observation, ObservationInput } from "../types";

export async function fetchObservations() {
  const { data, error } = await supabase
    .from("observations")
    .select("*, player:players(first_name,last_name,birth_year,primary_position,club:clubs(name))")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Observation[];
}

export async function fetchObservationsByPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("observations")
    .select("*, player:players(first_name,last_name,birth_year,primary_position,club:clubs(name))")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Observation[];
}

export async function fetchObservationById(id: string) {
  const { data, error } = await supabase
    .from("observations")
    .select("*, player:players(first_name,last_name,birth_year,primary_position,club:clubs(name))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Observation;
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

export async function updateObservation(id: string, input: Partial<ObservationInput>) {
  const { error } = await supabase.from("observations").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteObservation(id: string) {
  const { error } = await supabase.from("observations").delete().eq("id", id);
  if (error) throw error;
}
