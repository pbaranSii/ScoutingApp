import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type MatchObservationRow = Database["public"]["Tables"]["match_observations"]["Row"];
type MatchObservationInsert = Database["public"]["Tables"]["match_observations"]["Insert"];
type MatchObservationUpdate = Database["public"]["Tables"]["match_observations"]["Update"];

export type MatchObservation = MatchObservationRow;

export type MatchObservationInput = {
  observation_date: string;
  competition: string;
  league?: string | null;
  location?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  match_result?: string | null;
  source: string;
  scout_id: string;
  home_team_formation?: string | null;
  away_team_formation?: string | null;
  match_notes?: string | null;
  status?: string;
};

export async function createMatchObservation(
  input: MatchObservationInput
): Promise<MatchObservation> {
  const row: MatchObservationInsert = {
    context_type: input.source === "tournament" ? "tournament" : "match",
    observation_date: input.observation_date,
    competition: input.competition,
    league: input.league ?? null,
    location: input.location ?? null,
    home_team: input.home_team ?? null,
    away_team: input.away_team ?? null,
    match_result: input.match_result ?? null,
    source: input.source as MatchObservationInsert["source"],
    scout_id: input.scout_id,
    home_team_formation: input.home_team_formation ?? null,
    away_team_formation: input.away_team_formation ?? null,
    match_notes: input.match_notes ?? null,
    status: input.status ?? "active",
  };
  const { data, error } = await supabase
    .from("match_observations")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as MatchObservation;
}

export async function fetchMatchObservationById(id: string): Promise<MatchObservation | null> {
  const { data, error } = await supabase
    .from("match_observations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as MatchObservation | null;
}

export async function fetchMatchObservationsByScout(scoutId: string): Promise<MatchObservation[]> {
  const { data, error } = await supabase
    .from("match_observations")
    .select("*")
    .eq("scout_id", scoutId)
    .order("observation_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MatchObservation[];
}

export async function updateMatchObservation(
  id: string,
  input: Partial<MatchObservationInput>
): Promise<void> {
  const payload: MatchObservationUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (input.source !== undefined) payload.context_type = input.source === "tournament" ? "tournament" : "match";
  if (input.observation_date !== undefined) payload.observation_date = input.observation_date;
  if (input.competition !== undefined) payload.competition = input.competition;
  if (input.league !== undefined) payload.league = input.league;
  if (input.location !== undefined) payload.location = input.location;
  if (input.home_team !== undefined) payload.home_team = input.home_team;
  if (input.away_team !== undefined) payload.away_team = input.away_team;
  if (input.match_result !== undefined) payload.match_result = input.match_result;
  if (input.source !== undefined) payload.source = input.source as MatchObservationUpdate["source"];
  if (input.home_team_formation !== undefined) payload.home_team_formation = input.home_team_formation;
  if (input.away_team_formation !== undefined) payload.away_team_formation = input.away_team_formation;
  if (input.match_notes !== undefined) payload.match_notes = input.match_notes;
  if (input.status !== undefined) payload.status = input.status;

  const { error } = await supabase.from("match_observations").update(payload).eq("id", id);
  if (error) throw error;
}
