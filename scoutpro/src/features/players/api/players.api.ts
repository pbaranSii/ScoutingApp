import { supabase } from "@/lib/supabase";
import type { Player, PlayerInput } from "../types";

export async function fetchPlayers(filters?: {
  search?: string;
  birthYear?: number;
  status?: string;
}) {
  let query = supabase
    .from("players")
    .select("*, club:clubs(name), region:regions(name)")
    .order("created_at", { ascending: false });

  if (filters?.birthYear) {
    query = query.eq("birth_year", filters.birthYear);
  }
  if (filters?.status) {
    query = query.eq("pipeline_status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function fetchPlayerById(id: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*, club:clubs(name), region:regions(name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Player;
}

export async function createPlayer(input: PlayerInput) {
  const { data, error } = await supabase
    .from("players")
    .insert({
      ...input,
      pipeline_status: input.pipeline_status ?? "observed",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as Pick<Player, "id">;
}

export async function updatePlayer(id: string, input: PlayerInput) {
  const { error } = await supabase
    .from("players")
    .update({
      ...input,
    })
    .eq("id", id);

  if (error) throw error;
  return null;
}

export async function fetchClubs() {
  const { data, error } = await supabase
    .from("clubs")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function deletePlayer(id: string) {
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw error;
}

export async function updatePlayerStatus(id: string, status: string) {
  const { error } = await supabase
    .from("players")
    .update({ pipeline_status: status })
    .eq("id", id);

  if (error) throw error;
  return null;
}
