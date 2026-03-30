import { supabase } from "@/lib/supabase";

export type SurveyCanSubmitResponse = {
  can_submit: boolean;
  last_submitted_at: string | null;
  days_until_next: number;
};

export type SurveySubmitResponse = {
  survey_id: string;
  submitted_at: string;
};

export async function surveyCanSubmit(): Promise<SurveyCanSubmitResponse> {
  const { data, error } = await (supabase as any).rpc("survey_can_submit");
  if (error) throw error;
  return data as SurveyCanSubmitResponse;
}

export async function surveySubmit(payload: {
  csat_rating: number;
  ces_rating: number;
  nps_score: number;
  best_feature: string;
  feedback_text?: string | null;
}): Promise<SurveySubmitResponse> {
  const { data, error } = await (supabase as any).rpc("survey_submit", {
    p_csat_rating: payload.csat_rating,
    p_ces_rating: payload.ces_rating,
    p_nps_score: payload.nps_score,
    p_best_feature: payload.best_feature,
    p_feedback_text: payload.feedback_text ?? null,
  });
  if (error) throw error;
  return data as SurveySubmitResponse;
}

export const BEST_FEATURE_OPTIONS = [
  "Dodawanie obserwacji",
  "Przeglądanie zawodników",
  "Analytics / Raporty",
  "Eksport danych",
  "Filtry i wyszukiwanie",
] as const;
