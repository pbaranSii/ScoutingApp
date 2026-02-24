import { supabase } from "@/lib/supabase";

export type SurveyResultsResponse = {
  total: number;
  csat_avg: number;
  ces_avg: number;
  nps_score: number;
  promoters: number;
  passives: number;
  detractors: number;
  csat_distribution: Record<string, number>;
  best_feature_ranking: Array<{ feature: string; count: number }>;
};

export type SurveyResponseRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  user_role: string | null;
  csat_rating: number;
  ces_rating: number;
  nps_score: number;
  best_feature: string | null;
  feedback_text: string | null;
  submitted_at: string;
};

export type SurveyResponsesResult = {
  data: SurveyResponseRow[];
  total: number;
};

export async function fetchSurveyResults(period: string, role: string): Promise<SurveyResultsResponse> {
  const { data, error } = await (supabase as any).rpc("admin_survey_results", {
    p_period: period,
    p_role: role,
  });
  if (error) throw error;
  return data as SurveyResultsResponse;
}

export async function fetchSurveyResponses(
  period: string,
  role: string,
  page: number,
  perPage: number
): Promise<SurveyResponsesResult> {
  const { data, error } = await (supabase as any).rpc("admin_survey_responses", {
    p_period: period,
    p_role: role,
    p_page: page,
    p_per_page: perPage,
  });
  if (error) throw error;
  return data as SurveyResponsesResult;
}
