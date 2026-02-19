import { supabase } from "@/lib/supabase";

export type AnalyticsSettings = Record<string, string>;

export async function fetchAnalyticsSettings(): Promise<AnalyticsSettings> {
  const { data, error } = await (supabase as any).rpc("analytics_settings_get");
  if (error) throw error;
  const raw = (data ?? {}) as Record<string, unknown>;
  const normalized: AnalyticsSettings = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === null || v === undefined) continue;
    normalized[k] = typeof v === "string" ? v : String(v);
  }
  return normalized;
}

export async function saveAnalyticsSettings(settings: AnalyticsSettings): Promise<void> {
  const { error } = await (supabase as any).rpc("analytics_settings_upsert", { p_settings: settings });
  if (error) throw error;
}

