import { useMutation, useQuery } from "@tanstack/react-query";
import { surveyCanSubmit, surveySubmit } from "../api/survey.api";

export function useSurveyCanSubmit() {
  return useQuery({
    queryKey: ["survey", "can-submit"],
    queryFn: surveyCanSubmit,
  });
}

export function useSurveySubmit() {
  return useMutation({
    mutationFn: surveySubmit,
  });
}
