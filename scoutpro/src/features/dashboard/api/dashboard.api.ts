import { supabase } from "@/lib/supabase";

export async function fetchObservationCounts(
  startOfMonthIso: string,
  startOfWeekIso: string,
  scoutId?: string
) {
  const base = (gteDate?: string) => {
    let q = supabase.from("observations").select("*", { count: "exact", head: true });
    if (scoutId) q = q.eq("scout_id", scoutId);
    if (gteDate) q = q.gte("observation_date", gteDate);
    return q;
  };
  const [total, monthly, weekly] = await Promise.all([
    base(),
    base(startOfMonthIso),
    base(startOfWeekIso),
  ]);
  if (total.error) throw total.error;
  if (monthly.error) throw monthly.error;
  if (weekly.error) throw weekly.error;
  return {
    total: total.count ?? 0,
    monthly: monthly.count ?? 0,
    weekly: weekly.count ?? 0,
  };
}

export async function fetchPlayerCount(createdBy?: string) {
  let query = supabase.from("players").select("*", { count: "exact", head: true });
  if (createdBy) query = query.eq("created_by", createdBy);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchPlayersByStatus(createdBy?: string) {
  let query = supabase.from("players").select("id, pipeline_status");
  if (createdBy) query = query.eq("created_by", createdBy);
  const { data, error } = await query;
  if (error) throw error;

  const counts: Record<string, number> = {};
  (data ?? []).forEach((player) => {
    const status = (player.pipeline_status ?? "observed") as string;
    counts[status] = (counts[status] ?? 0) + 1;
  });

  return counts;
}

export type RecentPlayer = {
  id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  created_at: string;
  primary_position: string | null;
};

export async function fetchRecentPlayers(
  limit: number,
  createdBy?: string
): Promise<RecentPlayer[]> {
  let query = supabase
    .from("players")
    .select("id, first_name, last_name, birth_year, created_at, primary_position")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (createdBy) {
    query = query.eq("created_by", createdBy);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RecentPlayer[];
}

export async function fetchRecentObservations(limit = 5, scoutId?: string) {
  let query = supabase
    .from("observations")
    .select("id, rank, observation_date, player:players(first_name,last_name)")
    .order("observation_date", { ascending: false })
    .limit(limit);
  if (scoutId) {
    query = query.eq("scout_id", scoutId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchTopRankedPlayers() {
  const { data, error } = await supabase
    .from("observations")
    .select("id, rank, player:players(first_name,last_name,birth_year)")
    .eq("rank", "A")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data ?? [];
}
