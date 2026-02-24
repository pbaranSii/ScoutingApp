import { supabase } from "@/lib/supabase";
import type { PlayerDemand, PlayerDemandFilters } from "../types";
import { DEMAND_PRIORITY_ORDER } from "../types";

export async function fetchPlayerDemands(filters: PlayerDemandFilters = {}): Promise<PlayerDemand[]> {
  let query = supabase
    .from("player_demands")
    .select("id, club_id, season, league_ids, position, quantity_needed, priority, age_min, age_max, preferred_foot, style_notes, notes, status, filled_by_player_id, created_by, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (filters.clubId) query = query.eq("club_id", filters.clubId);
  if (filters.season) query = query.eq("season", filters.season);
  if (filters.position) query = query.eq("position", filters.position);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as PlayerDemand[];
  const withClubAndCount = await Promise.all(
    rows.map(async (row) => {
      const [clubRes, countRes] = await Promise.all([
        supabase.from("clubs").select("id, name").eq("id", row.club_id).maybeSingle(),
        supabase
          .from("player_demand_candidates")
          .select("*", { count: "exact", head: true })
          .eq("demand_id", row.id),
      ]);
      return {
        ...row,
        club: clubRes.data ?? null,
        candidates_count: countRes.count ?? 0,
      } as PlayerDemand;
    })
  );

  const priorityOrder = DEMAND_PRIORITY_ORDER as string[];
  withClubAndCount.sort((a, b) => {
    const ai = priorityOrder.indexOf(a.priority);
    const bi = priorityOrder.indexOf(b.priority);
    if (ai !== bi) return ai - bi;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return withClubAndCount;
}

export async function fetchPlayerDemandById(id: string): Promise<PlayerDemand | null> {
  const { data, error } = await supabase
    .from("player_demands")
    .select("id, club_id, season, league_ids, position, quantity_needed, priority, age_min, age_max, preferred_foot, style_notes, notes, status, filled_by_player_id, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [clubRes, countRes] = await Promise.all([
    supabase.from("clubs").select("id, name").eq("id", data.club_id).maybeSingle(),
    supabase.from("player_demand_candidates").select("*", { count: "exact", head: true }).eq("demand_id", id),
  ]);
  return {
    ...data,
    club: clubRes.data ?? null,
    candidates_count: countRes.count ?? 0,
  } as PlayerDemand;
}

export type CreatePlayerDemandInput = {
  club_id: string;
  season: string;
  league_ids?: string[];
  position: string;
  quantity_needed?: number;
  priority?: PlayerDemand["priority"];
  age_min?: number | null;
  age_max?: number | null;
  preferred_foot?: PlayerDemand["preferred_foot"] | null;
  style_notes?: string | null;
  notes?: string | null;
};

export async function createPlayerDemand(input: CreatePlayerDemandInput): Promise<PlayerDemand> {
  const { data: authUser } = await supabase.auth.getUser();
  const uid = authUser?.user ?? null;
  if (!uid) throw new Error("Nie jesteś zalogowany.");

  const { data, error } = await supabase
    .from("player_demands")
    .insert({
      club_id: input.club_id,
      season: input.season.trim(),
      league_ids: input.league_ids ?? [],
      position: input.position,
      quantity_needed: input.quantity_needed ?? 1,
      priority: input.priority ?? "standard",
      age_min: input.age_min ?? null,
      age_max: input.age_max ?? null,
      preferred_foot: input.preferred_foot ?? "any",
      style_notes: input.style_notes?.trim() || null,
      notes: input.notes?.trim() || null,
      status: "open",
      created_by: uid.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PlayerDemand;
}

export type UpdatePlayerDemandInput = Partial<{
  club_id: string;
  season: string;
  league_ids: string[];
  position: string;
  quantity_needed: number;
  priority: PlayerDemand["priority"];
  age_min: number | null;
  age_max: number | null;
  preferred_foot: PlayerDemand["preferred_foot"] | null;
  style_notes: string | null;
  notes: string | null;
  status: PlayerDemand["status"];
  filled_by_player_id: string | null;
}>;

export async function updatePlayerDemand(id: string, input: UpdatePlayerDemandInput): Promise<PlayerDemand> {
  const payload: Record<string, unknown> = {};
  if (input.club_id !== undefined) payload.club_id = input.club_id;
  if (input.season !== undefined) payload.season = input.season.trim();
  if (input.league_ids !== undefined) payload.league_ids = input.league_ids;
  if (input.position !== undefined) payload.position = input.position;
  if (input.quantity_needed !== undefined) payload.quantity_needed = input.quantity_needed;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.age_min !== undefined) payload.age_min = input.age_min;
  if (input.age_max !== undefined) payload.age_max = input.age_max;
  if (input.preferred_foot !== undefined) payload.preferred_foot = input.preferred_foot;
  if (input.style_notes !== undefined) payload.style_notes = input.style_notes?.trim() || null;
  if (input.notes !== undefined) payload.notes = input.notes?.trim() || null;
  if (input.status !== undefined) payload.status = input.status;
  if (input.filled_by_player_id !== undefined) payload.filled_by_player_id = input.filled_by_player_id;

  const { data, error } = await supabase.from("player_demands").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as PlayerDemand;
}

export async function deletePlayerDemand(id: string): Promise<void> {
  const { error } = await supabase.from("player_demands").delete().eq("id", id);
  if (error) throw error;
}

/** Fetch leagues for demand form (multi-select). */
export async function fetchLeagues(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("leagues")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
}

export async function fetchPlayerDemandsByIds(ids: string[]): Promise<PlayerDemand[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("player_demands")
    .select("id, club_id, season, league_ids, position, quantity_needed, priority, age_min, age_max, preferred_foot, style_notes, notes, status, filled_by_player_id, created_by, created_at, updated_at")
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as PlayerDemand[];
  const clubIds = [...new Set(rows.map((r) => r.club_id))];
  const { data: clubs } = await supabase.from("clubs").select("id, name").in("id", clubIds);
  const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));
  return rows.map((r) => ({ ...r, club: clubMap.get(r.club_id) ?? null } as PlayerDemand));
}
