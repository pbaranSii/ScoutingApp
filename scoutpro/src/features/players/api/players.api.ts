import { supabase } from "@/lib/supabase";
import type { PipelineHistoryEntry, PipelineStatus, Player, PlayerInput } from "../types";

export type PlayerSearchItem = {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  club?: { name: string } | null;
  primary_position?: string | null;
};

/** List players for task observation form (id, name, position, club). Limit 500. */
export async function fetchPlayersForTask(): Promise<PlayerSearchItem[]> {
  const { data, error } = await supabase
    .from("players")
    .select("id, first_name, last_name, birth_year, primary_position, club:clubs(name)")
    .order("last_name", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as PlayerSearchItem[];
}

/** Search players by name or club (min 2 chars), limit 20, for observation form. */
export async function searchPlayers(query: string): Promise<PlayerSearchItem[]> {
  const q = (query ?? "").trim();
  if (q.length < 2) return [];
  const searchTerm = `%${q}%`;
  const { data, error } = await supabase
    .from("players")
    .select("id, first_name, last_name, birth_year, primary_position, club:clubs(name)")
    .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    .order("last_name", { ascending: true })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as PlayerSearchItem[];
}

export type DuplicateCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  club?: { name: string } | null;
  primary_position?: string | null;
  score: number;
};

/** Check for potential duplicate players (strict + fuzzy). Returns candidates with score >= 40. */
export async function checkDuplicatePlayers(candidate: {
  first_name: string;
  last_name: string;
  birth_year: number;
  current_club?: string | null;
}): Promise<DuplicateCandidate[]> {
  const fn = (candidate.first_name ?? "").trim().toLowerCase();
  const ln = (candidate.last_name ?? "").trim().toLowerCase();
  const by = candidate.birth_year;
  const club = (candidate.current_club ?? "").trim().toLowerCase();
  if (!fn || !ln || !by) return [];

  const { data: strict, error: e1 } = await supabase
    .from("players")
    .select("id, first_name, last_name, birth_year, primary_position, club:clubs(name)")
    .ilike("first_name", fn)
    .ilike("last_name", ln)
    .eq("birth_year", by)
    .limit(10);
  if (e1) throw e1;
  const strictRows = (strict ?? []) as (DuplicateCandidate & { club?: { name: string } | null })[];
  const withScore: DuplicateCandidate[] = strictRows.map((row) => {
    let score = 80;
    if (row.club?.name && club && row.club.name.toLowerCase().includes(club)) score += 15;
    return {
      ...row,
      club: row.club,
      score,
    };
  });

  if (withScore.length >= 10) return withScore.slice(0, 10);

  const { data: fuzzy } = await supabase
    .from("players")
    .select("id, first_name, last_name, birth_year, primary_position, club:clubs(name)")
    .or(`first_name.ilike.%${fn}%,last_name.ilike.%${ln}%`)
    .gte("birth_year", by - 1)
    .lte("birth_year", by + 1)
    .limit(20);
  const fuzzyRows = (fuzzy ?? []) as (DuplicateCandidate & { club?: { name: string } | null })[];
  const seen = new Set(withScore.map((r) => r.id));
  for (const row of fuzzyRows) {
    if (seen.has(row.id)) continue;
    let score = 0;
    if (row.first_name?.toLowerCase() === fn) score += 30;
    else if (row.first_name?.toLowerCase().includes(fn)) score += 15;
    if (row.last_name?.toLowerCase() === ln) score += 30;
    else if (row.last_name?.toLowerCase().includes(ln)) score += 15;
    if (row.birth_year === by) score += 20;
    if (row.club?.name && club && row.club.name.toLowerCase().includes(club)) score += 15;
    if (score >= 40) {
      seen.add(row.id);
      withScore.push({ ...row, club: row.club, score });
    }
  }
  withScore.sort((a, b) => b.score - a.score);
  return withScore.slice(0, 10);
}

export type PlayersFilters = {
  search?: string;
  birthYear?: number;
  birthYears?: number[];
  status?: PipelineStatus;
  primary_position?: string;
  clubIds?: string[];
  scoutId?: string;
};

export async function fetchPlayers(filters?: PlayersFilters) {
  let query = supabase
    .from("players")
    .select("*, club:clubs(name), region:regions(name), observations:observations(count)")
    .order("created_at", { ascending: false });

  if (filters?.birthYear) {
    query = query.eq("birth_year", filters.birthYear);
  }
  if (filters?.birthYears && filters.birthYears.length > 0) {
    query = query.in("birth_year", filters.birthYears);
  }
  if (filters?.status) {
    query = query.eq("pipeline_status", filters.status);
  }
  if (filters?.primary_position) {
    query = query.eq("primary_position", filters.primary_position);
  }
  if (filters?.clubIds && filters.clubIds.length > 0) {
    query = query.in("club_id", filters.clubIds);
  }
  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    );
  }

  if (filters?.scoutId) {
    const { data: obs } = await supabase
      .from("observations")
      .select("player_id")
      .eq("scout_id", filters.scoutId);
    const playerIds = [...new Set((obs ?? []).map((o) => o.player_id).filter(Boolean))] as string[];
    if (playerIds.length === 0) {
      return [];
    }
    query = query.in("id", playerIds);
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

/** Max IDs per request to avoid 400 from URL length (PostgREST .in() in query string). */
const BATCH_IN_QUERY_CHUNK = 80;

/** Fetch pipeline_history entries for many players (for pipeline board status-since). Batched to avoid 400. */
export async function fetchPipelineHistoryBatch(
  playerIds: string[]
): Promise<PipelineHistoryEntry[]> {
  if (playerIds.length === 0) return [];
  const deduped = [...new Set(playerIds)];
  const all: PipelineHistoryEntry[] = [];
  for (let i = 0; i < deduped.length; i += BATCH_IN_QUERY_CHUNK) {
    const chunk = deduped.slice(i, i + BATCH_IN_QUERY_CHUNK);
    const { data, error } = await supabase
      .from("pipeline_history")
      .select("*")
      .in("player_id", chunk)
      .order("created_at", { ascending: false });
    if (error) throw error;
    all.push(...((data ?? []) as PipelineHistoryEntry[]));
  }
  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return all;
}
