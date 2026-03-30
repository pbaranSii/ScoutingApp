import { supabase } from "@/lib/supabase";
import type { PlayerDemandCandidate, DemandAssignmentType } from "../types";

export async function fetchCandidatesByDemand(demandId: string): Promise<PlayerDemandCandidate[]> {
  const { data, error } = await supabase
    .from("player_demand_candidates")
    .select("id, demand_id, player_id, assignment_type, accepted, assigned_by, assigned_at")
    .eq("demand_id", demandId)
    .order("assigned_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as (PlayerDemandCandidate & { player?: unknown })[];
  if (rows.length === 0) return rows as PlayerDemandCandidate[];

  const playerIds = [...new Set(rows.map((r) => r.player_id))];
  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, birth_year, primary_position, pipeline_status, club_id")
    .in("id", playerIds);

  const playerMap = new Map((players ?? []).map((p) => [p.id, p]));
  const clubIds = [...new Set((players ?? []).map((p) => p.club_id).filter(Boolean))] as string[];
  const { data: clubs } = await supabase.from("clubs").select("id, name").in("id", clubIds);
  const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));

  return rows.map((r) => {
    const p = playerMap.get(r.player_id);
    const club = p?.club_id ? clubMap.get(p.club_id) : null;
    return {
      ...r,
      player: p
        ? {
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            birth_year: p.birth_year,
            primary_position: p.primary_position,
            club: club ?? null,
            pipeline_status: p.pipeline_status,
          }
        : undefined,
    };
  }) as PlayerDemandCandidate[];
}

export async function addCandidate(
  demandId: string,
  playerId: string,
  assignmentType: DemandAssignmentType = "manual"
): Promise<PlayerDemandCandidate> {
  const { data: authUser } = await supabase.auth.getUser();
  const uid = authUser?.user ?? null;
  if (!uid) throw new Error("Nie jesteś zalogowany.");

  const { data, error } = await supabase
    .from("player_demand_candidates")
    .insert({
      demand_id: demandId,
      player_id: playerId,
      assignment_type: assignmentType,
      accepted: true,
      assigned_by: uid.id,
    })
    .select()
    .single();
  if (error) throw error;

  const row = data as PlayerDemandCandidate;
  const { data: demandRow } = await supabase.from("player_demands").select("status").eq("id", demandId).single();
  if (demandRow && demandRow.status === "open") {
    await supabase.from("player_demands").update({ status: "in_progress" }).eq("id", demandId);
  }
  return row;
}

export async function removeCandidate(demandId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from("player_demand_candidates")
    .delete()
    .eq("demand_id", demandId)
    .eq("player_id", playerId);
  if (error) throw error;
}

/** Fetch suggested players for a demand: same position, birth_year in [age_min, age_max]. */
export async function fetchDemandSuggestions(demandId: string): Promise<
  {
    id: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    primary_position: string | null;
    club_id: string | null;
    club?: { name: string } | null;
  }[]
> {
  const { data: demand, error: demandError } = await supabase
    .from("player_demands")
    .select("position, positions, age_min, age_max")
    .eq("id", demandId)
    .single();
  if (demandError || !demand) return [];

  const positions = (demand as { positions?: string[] }).positions?.length
    ? (demand as { positions: string[] }).positions
    : [demand.position].filter(Boolean);
  if (positions.length === 0) return [];

  let query = supabase
    .from("players")
    .select("id, first_name, last_name, birth_year, primary_position, club_id")
    .in("primary_position", positions);

  const currentYear = new Date().getFullYear();
  const ageMin = demand.age_min ?? 0;
  const ageMax = demand.age_max ?? 99;
  const birthYearMax = currentYear - ageMin;
  const birthYearMin = currentYear - ageMax;
  query = query.gte("birth_year", birthYearMin).lte("birth_year", birthYearMax);

  const { data: players, error } = await query.order("last_name").limit(100);
  if (error) return [];

  const list = (players ?? []) as { id: string; first_name: string; last_name: string; birth_year: number; primary_position: string | null; club_id: string | null }[];
  const clubIds = [...new Set(list.map((p) => p.club_id).filter(Boolean))] as string[];
  const { data: clubs } = await supabase.from("clubs").select("id, name").in("id", clubIds);
  const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));

  const { data: existing } = await supabase
    .from("player_demand_candidates")
    .select("player_id")
    .eq("demand_id", demandId);
  const assignedIds = new Set((existing ?? []).map((r) => r.player_id));

  return list
    .filter((p) => !assignedIds.has(p.id))
    .map((p) => ({
      ...p,
      club: p.club_id ? clubMap.get(p.club_id) ?? null : null,
    }));
}

/** Demands that contain this player (for player profile). */
export async function fetchDemandsContainingPlayer(playerId: string): Promise<{ demand_id: string }[]> {
  const { data, error } = await supabase
    .from("player_demand_candidates")
    .select("demand_id")
    .eq("player_id", playerId);
  if (error) throw error;
  return (data ?? []) as { demand_id: string }[];
}
