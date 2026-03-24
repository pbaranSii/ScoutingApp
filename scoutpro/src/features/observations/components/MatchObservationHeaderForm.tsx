import { forwardRef, useEffect, useImperativeHandle, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useCategoriesForCurrentArea, useLeaguesForCurrentArea } from "@/features/dictionaries/hooks/useDictionaries";
import { useFormations } from "@/features/tactical/hooks/useFormations";
import { ClubSelect } from "@/features/players/components/ClubSelect";
import { fetchClubByName } from "@/features/players/api/players.api";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";

/** Źródło obserwacji meczowej (jedno pole zamiast context_type + source). */
export const MATCH_SOURCE_OPTIONS = [
  { value: "live_match", label: "Mecz na żywo" },
  { value: "video_match", label: "Mecz wideo" },
  { value: "video_clips", label: "Fragmenty wideo" },
  { value: "tournament", label: "Turniej" },
] as const;

const headerSchema = z
  .object({
    observation_date: z.string().min(1, "Wybierz datę"),
    competition: z.string().optional(),
    league: z.string().max(200).optional(),
    home_team: z.string().optional(),
    away_team: z.string().optional(),
    match_result: z
      .string()
      .optional()
      .refine((s) => s === undefined || s === "" || /^\d{1,2}[-:]\d{1,2}$/.test(s), "Format: X:Y (np. 2:1)"),
    source: z.enum(["live_match", "video_match", "video_clips", "tournament"]),
    home_team_formation: z.string().optional(),
    away_team_formation: z.string().optional(),
    match_notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.source !== "tournament") {
      if (!(data.home_team ?? "").trim() || (data.home_team ?? "").trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Min. 2 znaki", path: ["home_team"] });
      }
      if (!(data.away_team ?? "").trim() || (data.away_team ?? "").trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Min. 2 znaki", path: ["away_team"] });
      }
      if (!(data.match_result ?? "").trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Podaj wynik", path: ["match_result"] });
      }
    }
  });

export type MatchHeaderFormValues = z.infer<typeof headerSchema>;

export function validateMatchHeader(values: unknown): MatchHeaderFormValues {
  return headerSchema.parse(values);
}

export type MatchObservationHeaderFormRef = {
  /** Returns validated values or null. Triggers validation and shows errors under fields. */
  validateAndGetValues: () => Promise<MatchHeaderFormValues | null>;
  getValues: () => MatchHeaderFormValues | null;
};

type MatchObservationHeaderFormProps = {
  /** Initial values for edit mode. */
  initialValues?: Partial<MatchHeaderFormValues>;
  /** Called when form values change (e.g. to pass home_team/away_team to player cards). */
  onValuesChange?: (values: MatchHeaderFormValues) => void;
};

export const MatchObservationHeaderForm = forwardRef<
  MatchObservationHeaderFormRef,
  MatchObservationHeaderFormProps
>(function MatchObservationHeaderForm({ initialValues, onValuesChange }, ref) {
  const { data: categories = [] } = useCategoriesForCurrentArea();
  const { data: leagues = [] } = useLeaguesForCurrentArea();
  const { data: currentUser } = useCurrentUserProfile();
  const areaAccess = (currentUser as { area_access?: "AKADEMIA" | "SENIOR" | "ALL" } | null)?.area_access ?? "AKADEMIA";
  const showCompetitionField = areaAccess !== "SENIOR";
  const { data: formations = [] } = useFormations();
  const formationSelect = formations as unknown as { id: string; code?: string | null; name: string }[];
  const formationOptionValue = useCallback((f: { id: string; code?: string | null }) => {
    const code = String(f.code ?? "").trim();
    return code || f.id;
  }, []);
  const normalizeFormationForSelect = useCallback(
    (value?: string) => {
      const current = String(value ?? "").trim();
      if (!current) return "";
      const byId = formationSelect.find((f) => f.id === current);
      if (byId) return formationOptionValue(byId);
      return current;
    },
    [formationSelect, formationOptionValue]
  );

  const form = useForm<MatchHeaderFormValues>({
    resolver: zodResolver(headerSchema),
    defaultValues: {
      observation_date: format(new Date(), "yyyy-MM-dd"),
      competition: "",
      league: "",
      home_team: "",
      away_team: "",
      match_result: "",
      source: "live_match",
      home_team_formation: "",
      away_team_formation: "",
      match_notes: "",
      ...initialValues,
    },
  });

  const source = form.watch("source");
  const isMatchLike = source !== "tournament";
  const allValues = form.watch();

  const autofillLeagueFromClub = useCallback(
    async (clubName: string) => {
      const currentLeague = String(form.getValues("league") ?? "").trim();
      if (currentLeague) return;
      const club = await fetchClubByName(clubName);
      const leagueName = String(club?.league?.display_name ?? club?.league?.name ?? "").trim();
      if (leagueName) {
        form.setValue("league", leagueName, { shouldDirty: true, shouldTouch: true });
      }
    },
    [form]
  );

  useEffect(() => {
    onValuesChange?.(form.getValues());
  }, [allValues, onValuesChange, form]);

  useImperativeHandle(ref, () => ({
    async validateAndGetValues() {
      const valid = await form.trigger();
      if (!valid) return null;
      const parsed = headerSchema.safeParse(form.getValues());
      return parsed.success ? parsed.data : null;
    },
    getValues: () => {
      const vals = form.getValues();
      const parsed = headerSchema.safeParse(vals);
      return parsed.success ? parsed.data : null;
    },
  }));

  const defaults = {
    observation_date: format(new Date(), "yyyy-MM-dd"),
    competition: "",
    league: "",
    home_team: "",
    away_team: "",
    match_result: "",
    source: "live_match" as const,
    home_team_formation: "",
    away_team_formation: "",
    match_notes: "",
  };
  const initialValuesAppliedRef = useRef(false);
  useEffect(() => {
    if (!initialValues || Object.keys(initialValues).length === 0) return;
    if (initialValuesAppliedRef.current) return;
    initialValuesAppliedRef.current = true;
    form.reset({
      ...defaults,
      ...initialValues,
      home_team_formation: normalizeFormationForSelect(initialValues.home_team_formation),
      away_team_formation: normalizeFormationForSelect(initialValues.away_team_formation),
    });
  }, [initialValues, form, normalizeFormationForSelect]);

  useEffect(() => {
    if (!initialValues || Object.keys(initialValues).length === 0) {
      initialValuesAppliedRef.current = false;
    }
  }, [initialValues]);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <Label>Źródło <span className="text-red-600">*</span></Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz źródło" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MATCH_SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="observation_date"
            render={({ field }) => (
              <FormItem>
                <Label>Data meczu <span className="text-red-600">*</span></Label>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="league"
            render={({ field }) => (
              <FormItem>
                <Label>Liga</Label>
                <Select value={field.value && String(field.value).trim() !== "" ? field.value : "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz ligę" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">— Brak —</SelectItem>
                    {(leagues as Record<string, unknown>[])
                      .filter((l) => String(l.display_name ?? l.name ?? "").trim() !== "")
                      .map((l) => {
                        const value = String(l.display_name ?? l.name ?? "");
                        return (
                          <SelectItem key={String(l.id)} value={value}>
                            {value}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {showCompetitionField && (
            <FormField
              control={form.control}
              name="competition"
              render={({ field }) => (
                <FormItem>
                  <Label>Kategoria wiekowa <span className="text-red-600">*</span></Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz kategorię wiekową" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c: Record<string, unknown>) => (
                        <SelectItem key={String(c.id)} value={String(c.name ?? c.id)}>
                          {String(c.name ?? c.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        {isMatchLike && (
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="home_team"
              render={({ field }) => (
                <FormItem>
                  <Label>Gospodarz <span className="text-red-600">*</span></Label>
                  <FormControl>
                    <ClubSelect
                      value={field.value ?? ""}
                      onChange={(v) => {
                        field.onChange(v);
                        void autofillLeagueFromClub(v);
                      }}
                      placeholder="Wpisz lub wybierz klub..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="away_team"
              render={({ field }) => (
                <FormItem>
                  <Label>Gość <span className="text-red-600">*</span></Label>
                  <FormControl>
                    <ClubSelect
                      value={field.value ?? ""}
                      onChange={(v) => {
                        field.onChange(v);
                        void autofillLeagueFromClub(v);
                      }}
                      placeholder="Wpisz lub wybierz klub..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="match_result"
              render={({ field }) => (
                <FormItem>
                  <Label>Wynik <span className="text-red-600">*</span></Label>
                  <FormControl>
                    <Input placeholder="np. 2:1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        {isMatchLike && (
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="home_team_formation"
            render={({ field }) => (
              <FormItem>
                <Label>Formacja gospodarzy</Label>
                <Select
                  value={normalizeFormationForSelect(field.value) || "__none__"}
                  onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz schemat" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">— Brak —</SelectItem>
                    {formationSelect
                      .filter((f) => formationOptionValue(f).trim() !== "")
                      .map((f) => (
                      <SelectItem key={f.id} value={formationOptionValue(f)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="away_team_formation"
            render={({ field }) => (
              <FormItem>
                <Label>Formacja gości</Label>
                <Select
                  value={normalizeFormationForSelect(field.value) || "__none__"}
                  onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz schemat" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">— Brak —</SelectItem>
                    {formationSelect
                      .filter((f) => formationOptionValue(f).trim() !== "")
                      .map((f) => (
                      <SelectItem key={f.id} value={formationOptionValue(f)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="hidden sm:block" />
        </div>
        )}
        <FormField
          control={form.control}
          name="match_notes"
          render={({ field }) => (
            <FormItem>
              <Label>Notatki do meczu (max 2000 znaków)</Label>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
});
