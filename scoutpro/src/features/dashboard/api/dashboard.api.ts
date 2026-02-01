import { supabase } from "@/lib/supabase";

export async function fetchObservationCounts(startOfMonthIso: string) {
  const total = await supabase
    .from("observations")
    .select("*", { count: "exact", head: true });
  if (total.error) throw total.error;

  const monthly = await supabase
    .from("observations")
    .select("*", { count: "exact", head: true })
    .gte("observation_date", startOfMonthIso);
  if (monthly.error) throw monthly.error;

  return {
    total: total.count ?? 0,
    monthly: monthly.count ?? 0,
  };
}

export async function fetchPlayersByStatus() {
  const { data, error } = await supabase
    .from("players")
    .select("id, pipeline_status");
  if (error) throw error;

  const counts: Record<string, number> = {};
  (data ?? []).forEach((player) => {
    const status = (player.pipeline_status ?? "observed") as string;
    counts[status] = (counts[status] ?? 0) + 1;
  });

  return counts;
}

export async function fetchRecentObservations() {
  const { data, error } = await supabase
    .from("observations")
    .select("id, rank, observation_date, player:players(first_name,last_name)")
    .order("observation_date", { ascending: false })
    .limit(5);
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
