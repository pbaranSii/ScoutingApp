import { supabase } from "@/lib/supabase";
import type { PipelineHistoryEntry, PipelineStatus, Player, PlayerInput } from "../types";

export async function fetchPlayers(filters?: {
  search?: string;
  birthYear?: number;
  status?: PipelineStatus;
}) {
  let query = supabase
    .from("players")
    .select("*, club:clubs(name), region:regions(name), observations:observations(count)")
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
  return (data ?? []).map((player) => {
    const { observations, ...rest } = player as Player & { observations?: { count: number }[] };
    const observation_count =
      Array.isArray(observations) && observations.length > 0 ? observations[0]?.count ?? 0 : 0;
    return {
      ...rest,
      observation_count,
    };
  });
}

export async function fetchPlayerById(id: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*, club:clubs(name), region:regions(name), observations:observations(count)")
    .eq("id", id)
    .single();

  if (error) throw error;
  const { observations, ...rest } = (data ?? {}) as Player & { observations?: { count: number }[] };
  const observation_count =
    Array.isArray(observations) && observations.length > 0 ? observations[0]?.count ?? 0 : 0;
  return {
    ...rest,
    observation_count,
  };
}

export async function createPlayer(input: PlayerInput) {
  const { data, error } = await supabase
    .from("players")
    .insert({
      ...input,
      pipeline_status: input.pipeline_status ?? "unassigned",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as Pick<Player, "id">;
}

export async function updatePlayer(id: string, input: PlayerInput) {
  const { pipeline_status, ...rest } = input;
  const { error } = await supabase
    .from("players")
    .update({
      ...rest,
      pipeline_status: pipeline_status ?? undefined,
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
  const { data, error } = await supabase.from("players").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Nie udalo sie usunac zawodnika. Sprawdz uprawnienia lub czy rekord nadal istnieje."
    );
  }
}

export async function deletePipelineHistoryByPlayer(playerId: string) {
  const { error } = await supabase.from("pipeline_history").delete().eq("player_id", playerId);
  if (error) throw error;
}

export async function updatePlayerStatus(id: string, status: PipelineStatus) {
  const { error } = await supabase.from("players").update({ pipeline_status: status }).eq("id", id);
  if (error) throw error;
  return null;
}

export async function createPipelineHistory(input: {
  player_id: string;
  from_status?: string | null;
  to_status: string;
  changed_by: string;
  reason?: string | null;
}) {
  const { error } = await supabase.from("pipeline_history").insert({
    player_id: input.player_id,
    from_status: input.from_status ?? null,
    to_status: input.to_status,
    changed_by: input.changed_by,
    reason: input.reason ?? null,
  });
  if (error) throw error;
}

export async function updatePlayerStatusWithHistory(input: {
  id: string;
  status: PipelineStatus;
  changed_by?: string | null;
  from_status?: string | null;
}): Promise<{ historyError?: string | null }> {
  let previousStatus = input.from_status ?? null;
  if (previousStatus === null) {
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("pipeline_status")
      .eq("id", input.id)
      .single();
    if (playerError) throw playerError;
    previousStatus = (player?.pipeline_status as string | null) ?? null;
  }

  const { error } = await supabase
    .from("players")
    .update({ pipeline_status: input.status })
    .eq("id", input.id);
  if (error) throw error;

  let historyError: string | null = null;
  if (input.changed_by && previousStatus !== input.status) {
    try {
      await createPipelineHistory({
        player_id: input.id,
        from_status: previousStatus,
        to_status: input.status,
        changed_by: input.changed_by,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udalo sie zapisac historii.";
      console.warn("Pipeline history insert blocked:", err);
      historyError = message;
    }
  }
  return { historyError };
}

export async function fetchPipelineHistoryByPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("pipeline_history")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PipelineHistoryEntry[];
}
