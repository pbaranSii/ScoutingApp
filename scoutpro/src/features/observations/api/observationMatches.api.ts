import { supabase } from "@/lib/supabase";

const PGRST204_COLUMN_REGEX = /Could not find the '([^']+)' column of 'observation_matches'/;

export type ObservationMatchInput = {
  match_date: string; // yyyy-MM-dd
  competition?: string | null;
  league?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  match_result?: string | null;
  source?: string | null;
  home_team_formation?: string | null;
  away_team_formation?: string | null;
  notes?: string | null;
};

export type ObservationMatchRow = ObservationMatchInput & {
  id: string;
  observation_id: string;
  created_at: string;
};

export async function fetchObservationMatches(observationId: string): Promise<ObservationMatchRow[]> {
  const db = supabase as any;
  const { data, error } = await db
    .from("observation_matches")
    .select("*")
    .eq("observation_id", observationId)
    .order("match_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ObservationMatchRow[];
}

export async function replaceObservationMatches(observationId: string, matches: ObservationMatchInput[]): Promise<void> {
  const db = supabase as any;
  const { error: delError } = await db.from("observation_matches").delete().eq("observation_id", observationId);
  if (delError) throw delError;
  if (matches.length === 0) return;
  let payload = matches.map((m) => ({
    observation_id: observationId,
    match_date: m.match_date,
    competition: m.competition ?? null,
    league: m.league ?? null,
    home_team: m.home_team ?? null,
    away_team: m.away_team ?? null,
    match_result: m.match_result ?? null,
    source: m.source ?? null,
    home_team_formation: m.home_team_formation ?? null,
    away_team_formation: m.away_team_formation ?? null,
    notes: m.notes ?? null,
  }));

  const { error: insError } = await db.from("observation_matches").insert(payload as never);
  if (!insError) return;

  if (insError.code === "PGRST204") {
    const missingColumn = insError.message?.match(PGRST204_COLUMN_REGEX)?.[1];
    const hasFormationInput = matches.some(
      (m) => Boolean(String(m.home_team_formation ?? "").trim()) || Boolean(String(m.away_team_formation ?? "").trim())
    );
    const technicalDetails = missingColumn
      ? `Brak kolumny API: ${missingColumn}.`
      : "Brak kolumny API w schemacie PostgREST.";
    const message = hasFormationInput
      ? `Nie udalo sie zapisac formacji meczu. ${technicalDetails} Odswiez schemat Supabase i sprobuj ponownie.`
      : `Nie udalo sie zapisac spotkan obserwacji. ${technicalDetails} Odswiez schemat Supabase i sprobuj ponownie.`;
    throw new Error(message);
  }

  throw insError;
}

/** Batch helper for observation list: returns observationId -> matchCount */
export async function fetchObservationMatchCounts(
  observationIds: string[]
): Promise<Record<string, number>> {
  const ids = [...new Set(observationIds)].filter(Boolean);
  if (ids.length === 0) return {};
  const db = supabase as any;
  const { data, error } = await db
    .from("observation_matches")
    .select("observation_id")
    .in("observation_id", ids);
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const r of (data ?? []) as { observation_id: string }[]) {
    map[r.observation_id] = (map[r.observation_id] ?? 0) + 1;
  }
  return map;
}

