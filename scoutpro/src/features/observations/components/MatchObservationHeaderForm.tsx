import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useCategories } from "@/features/dictionaries/hooks/useDictionaries";
import { usePlayerSources } from "@/features/dictionaries/hooks/useDictionaries";
import { useFormations } from "@/features/tactical/hooks/useFormations";
import { ClubSelect } from "@/features/players/components/ClubSelect";

const headerSchema = z
  .object({
    context_type: z.enum(["match", "tournament"]),
    observation_date: z.string().min(1, "Wybierz datę"),
    competition: z.string().min(1, "Wybierz rozgrywki"),
    home_team: z.string().optional(),
    away_team: z.string().optional(),
    match_result: z
      .string()
      .optional()
      .refine((s) => s === undefined || s === "" || /^\d{1,2}[-:]\d{1,2}$/.test(s), "Format: X:Y (np. 2:1)"),
    location: z.string().max(200).optional(),
    source: z.string().min(1, "Wybierz źródło"),
    home_team_formation: z.string().optional(),
    away_team_formation: z.string().optional(),
    match_notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.context_type === "match") {
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
  const { data: categories = [] } = useCategories();
  const { data: playerSources = [] } = usePlayerSources();
  const { data: formations = [] } = useFormations();

  const form = useForm<MatchHeaderFormValues>({
    resolver: zodResolver(headerSchema),
    defaultValues: {
      context_type: "match",
      observation_date: format(new Date(), "yyyy-MM-dd"),
      competition: "",
      home_team: "",
      away_team: "",
      match_result: "",
      location: "",
      source: "scouting",
      home_team_formation: "",
      away_team_formation: "",
      match_notes: "",
      ...initialValues,
    },
  });

  const contextType = form.watch("context_type");
  const isMatch = contextType === "match";
  const allValues = form.watch();

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
    context_type: "match" as const,
    observation_date: format(new Date(), "yyyy-MM-dd"),
    competition: "",
    home_team: "",
    away_team: "",
    match_result: "",
    location: "",
    source: "scouting",
    home_team_formation: "",
    away_team_formation: "",
    match_notes: "",
  };
  const initialValuesAppliedRef = useRef(false);
  useEffect(() => {
    if (!initialValues || Object.keys(initialValues).length === 0) return;
    if (initialValuesAppliedRef.current) return;
    initialValuesAppliedRef.current = true;
    form.reset({ ...defaults, ...initialValues });
  }, [initialValues, form]);

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
            name="context_type"
            render={({ field }) => (
              <FormItem>
                <Label>Typ kontekstu</Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="match">Mecz</SelectItem>
                    <SelectItem value="tournament">Turniej</SelectItem>
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
                <Label>Data obserwacji <span className="text-red-600">*</span></Label>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    {(playerSources as { source_code?: string; name_pl?: string }[]).map((s) => (
                      <SelectItem key={String(s.source_code)} value={String(s.source_code)}>
                        {String(s.name_pl ?? s.source_code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="competition"
            render={({ field }) => (
              <FormItem>
                <Label>Rozgrywki <span className="text-red-600">*</span></Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz rozgrywki" />
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
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <Label>Lokalizacja</Label>
                <FormControl>
                  <Input placeholder="Miasto / stadion" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {isMatch && (
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
                      onChange={field.onChange}
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
                      onChange={field.onChange}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="home_team_formation"
            render={({ field }) => (
              <FormItem>
                <Label>Formacja gospodarzy</Label>
                <Select value={field.value || "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz schemat" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">— Brak —</SelectItem>
                    {formations.map((f: { id: string; name: string; code: string }) => (
                      <SelectItem key={f.id} value={f.code}>
                        {f.name} ({f.code})
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
                <Select value={field.value || "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz schemat" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">— Brak —</SelectItem>
                    {formations.map((f: { id: string; name: string; code: string }) => (
                      <SelectItem key={f.id} value={f.code}>
                        {f.name} ({f.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="match_notes"
          render={({ field }) => (
            <FormItem>
              <Label>Notatki do meczu (opcjonalnie, max 2000 znaków)</Label>
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
