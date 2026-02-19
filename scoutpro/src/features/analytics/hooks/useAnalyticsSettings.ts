import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAnalyticsSettings, saveAnalyticsSettings } from "../api/analyticsSettings.api";

export function useAnalyticsSettings() {
  return useQuery({
    queryKey: ["analytics-settings"],
    queryFn: fetchAnalyticsSettings,
  });
}

export function useSaveAnalyticsSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveAnalyticsSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analytics-settings"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

