import { useQuery } from "@tanstack/react-query";
import { fetchSurveyResponses, fetchSurveyResults } from "../api/surveyResults.api";

export function useSurveyResults(period: string, role: string) {
  return useQuery({
    queryKey: ["admin", "survey-results", period, role],
    queryFn: () => fetchSurveyResults(period, role),
  });
}

export function useSurveyResponses(period: string, role: string, page: number, perPage: number) {
  return useQuery({
    queryKey: ["admin", "survey-responses", period, role, page, perPage],
    queryFn: () => fetchSurveyResponses(period, role, page, perPage),
  });
}
