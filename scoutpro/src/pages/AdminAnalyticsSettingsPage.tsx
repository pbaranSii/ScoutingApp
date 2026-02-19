import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnalyticsSettings, useSaveAnalyticsSettings } from "@/features/analytics/hooks/useAnalyticsSettings";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { toast } from "@/hooks/use-toast";

type SettingField = {
  key: string;
  label: string;
  placeholder?: string;
};

const CONVERSION_FIELDS: SettingField[] = [
  { key: "target_first_to_observed", label: "First Contact → Observed Target (%)", placeholder: "80" },
  { key: "target_observed_to_shortlist", label: "Observed → Shortlist Target (%)", placeholder: "60" },
  { key: "target_shortlist_to_trial", label: "Shortlist → Trial Target (%)", placeholder: "65" },
  { key: "target_trial_to_offer", label: "Trial → Offer Target (%)", placeholder: "70" },
  { key: "target_offer_to_signed", label: "Offer → Signed Target (%)", placeholder: "75" },
];

const TIME_LIMIT_FIELDS: SettingField[] = [
  { key: "max_days_in_observed", label: "Max Days in Observed", placeholder: "14" },
  { key: "max_days_in_shortlist", label: "Max Days in Shortlist", placeholder: "21" },
  { key: "max_days_in_trial", label: "Max Days in Trial", placeholder: "30" },
  { key: "max_days_in_offer", label: "Max Days in Offer", placeholder: "14" },
];

const SEASON_FIELDS: SettingField[] = [
  { key: "target_signed_per_season", label: "Target Signed Players per Season", placeholder: "50" },
  { key: "season_start_date", label: "Season Start Date (YYYY-MM-DD)", placeholder: "2025-08-01" },
  { key: "season_end_date", label: "Season End Date (YYYY-MM-DD)", placeholder: "2026-06-30" },
];

const RETENTION_FIELDS: SettingField[] = [
  { key: "history_retention_years", label: "History Retention (years)", placeholder: "3" },
  { key: "archive_old_data", label: "Archive Old Data (true/false)", placeholder: "true" },
];

export function AdminAnalyticsSettingsPage() {
  const { data: currentUser } = useCurrentUserProfile();
  const isAdmin = currentUser?.role === "admin";

  const settingsQuery = useAnalyticsSettings();
  const saveMutation = useSaveAnalyticsSettings();

  const baseSettings = settingsQuery.data ?? {};
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const draft = useMemo(() => ({ ...baseSettings, ...overrides }), [baseSettings, overrides]);

  const allFields = useMemo(
    () => [
      { title: "Conversion Targets", fields: CONVERSION_FIELDS },
      { title: "Time Limits (Bottleneck Detection)", fields: TIME_LIMIT_FIELDS },
      { title: "Seasonal Targets", fields: SEASON_FIELDS },
      { title: "Data Retention", fields: RETENTION_FIELDS },
    ],
    []
  );

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics Settings" subtitle="Brak dostępu." />
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Tylko Administrator ma dostęp do ustawień analityki.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics Settings" subtitle="Ustawienia celów, limitów i sezonu dla Recruitment Analytics." />

      {settingsQuery.isLoading && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Ładowanie ustawień…
        </div>
      )}

      {settingsQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Nie udało się pobrać ustawień.
        </div>
      )}

      {!settingsQuery.isLoading && (
        <div className="space-y-4">
          {allFields.map((section) => (
            <div key={section.title} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">{section.title}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {section.fields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">{f.label}</label>
                    <Input
                      value={draft[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) =>
                        setOverrides((s) => ({ ...s, [f.key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOverrides({})}
              disabled={saveMutation.isPending}
            >
              Reset
            </Button>
            <Button
              onClick={async () => {
                try {
                  await saveMutation.mutateAsync(draft);
                  setOverrides({});
                  toast({ title: "Ustawienia zapisane" });
                } catch {
                  toast({
                    title: "Zapis nieudany",
                    description: "Sprawdź uprawnienia lub poprawność danych.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={saveMutation.isPending}
            >
              Zapisz ustawienia
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

