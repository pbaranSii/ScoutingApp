import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useClubs } from "@/features/players/hooks/usePlayers";
import { usePositionDictionary } from "@/features/tactical/hooks/usePositionDictionary";
import { getPositionOptionsFromDictionary } from "@/features/players/components/PositionDictionarySelect";
import {
  useCreatePlayerDemand,
  useUpdatePlayerDemand,
  usePlayerDemand,
} from "@/features/demands/hooks";
import { fetchLeagues } from "@/features/demands/api/demands.api";
import { useQuery } from "@tanstack/react-query";
import type { DemandPriority, DemandStatus, DemandPreferredFoot } from "@/features/demands/types";
import { DEMAND_PRIORITY_LABELS, DEMAND_PREFERRED_FOOT_LABELS } from "@/features/demands/types";
import { toast } from "@/hooks/use-toast";

const demandSchema = z.object({
  season: z.string().min(1, "Podaj okres (np. 2025/2026)"),
  league_ids: z.array(z.string()).default([]),
  positions: z.array(z.string()).min(1, "Wybierz co najmniej jedną pozycję"),
  quantity_needed: z.coerce.number().int().min(1).max(20).default(1),
  priority: z.enum(["critical", "high", "standard"]),
  age_min: z.union([z.coerce.number().int().min(0).max(99), z.nan()]).optional().nullable(),
  age_max: z.union([z.coerce.number().int().min(0).max(99), z.nan()]).optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["open", "in_progress", "filled", "cancelled"]).optional(),
});

type DemandFormValues = z.infer<typeof demandSchema>;

type DemandFormProps = {
  mode: "create" | "edit";
  demandId?: string;
  onSuccess?: () => void;
};

export function DemandForm({ mode, demandId, onSuccess }: DemandFormProps) {
  const { data: clubs = [] } = useClubs();
  const { data: positionDictionary = [] } = usePositionDictionary(true);
  const positionOptions = getPositionOptionsFromDictionary(positionDictionary);
  const { data: leagues = [] } = useQuery({
    queryKey: ["leagues"],
    queryFn: fetchLeagues,
  });
  const { data: demand } = usePlayerDemand(mode === "edit" ? demandId ?? null : null);
  const createDemand = useCreatePlayerDemand();
  const updateDemand = useUpdatePlayerDemand();

  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandSchema) as Resolver<DemandFormValues>,
    defaultValues: {
      season: "",
      league_ids: [],
      positions: [] as string[],
      quantity_needed: 1,
      priority: "standard",
      age_min: 18,
      age_max: 23,
      notes: "",
      status: "open",
    },
    values:
      mode === "edit" && demand
        ? {
            season: demand.season,
            league_ids: demand.league_ids ?? [],
            positions: (demand as { positions?: string[] }).positions?.length
              ? (demand as { positions: string[] }).positions
              : [demand.position].filter(Boolean),
            quantity_needed: demand.quantity_needed,
            priority: demand.priority,
            age_min: demand.age_min ?? undefined,
            age_max: demand.age_max ?? undefined,
            notes: demand.notes ?? "",
            status: demand.status,
          }
        : undefined,
  });

  const onSubmit = async (values: DemandFormValues) => {
    try {
      if (mode === "create") {
        await createDemand.mutateAsync({
          // Pole klub zostało usunięte z formularza – backend może ustawiać je domyślnie lub na podstawie użytkownika.
          club_id: demand?.club_id ?? "", // zachowanie wstecznej kompatybilności, jeśli wymagane
          season: values.season.trim(),
          league_ids: values.league_ids?.length ? values.league_ids : undefined,
          positions: values.positions,
          quantity_needed: values.quantity_needed,
          priority: values.priority as DemandPriority,
          age_min: values.age_min ?? null,
          age_max: values.age_max ?? null,
          preferred_foot: null as DemandPreferredFoot | null,
          style_notes: null,
          notes: values.notes?.trim() || null,
        });
        toast({ title: "Zapotrzebowanie utworzone" });
      } else if (demandId) {
        await updateDemand.mutateAsync({
          id: demandId,
          input: {
            club_id: demand.club_id,
            season: values.season.trim(),
            league_ids: values.league_ids,
            positions: values.positions,
            quantity_needed: values.quantity_needed,
            priority: values.priority as DemandPriority,
            age_min: values.age_min ?? null,
            age_max: values.age_max ?? null,
            preferred_foot: null,
            style_notes: null,
            notes: values.notes?.trim() || null,
            status: values.status as DemandStatus,
          },
        });
        toast({ title: "Zapotrzebowanie zaktualizowane" });
      }
      onSuccess?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się zapisać.",
      });
    }
  };

  const isPending = createDemand.isPending || updateDemand.isPending;
  const canEditStatus = mode === "edit" && demand && ["open", "in_progress"].includes(demand.status);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dane zapotrzebowania</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pole „Klub” zostało usunięte z formularza zgodnie z wymaganiami. */}
            <FormField
              control={form.control}
              name="positions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pozycje * (wybierz co najmniej jedną)</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-3">
                      {positionOptions.map((opt) => {
                        const checked = (field.value ?? []).includes(opt.value);
                        return (
                          <label
                            key={opt.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const current = field.value ?? [];
                                if (current.includes(opt.value)) {
                                  field.onChange(current.filter((p) => p !== opt.value));
                                } else {
                                  field.onChange([...current, opt.value]);
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            <span>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Okres *</FormLabel>
                    <FormControl>
                      <Input placeholder="np. 2025/2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="league_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ligi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="np. Ekstraklasa, 1. Liga"
                      value={field.value?.[0] ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.trim() ? [e.target.value] : []
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity_needed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liczba poszukiwanych *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={20} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorytet</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["critical", "high", "standard"] as const).map((p) => (
                          <SelectItem key={p} value={p}>
                            {DEMAND_PRIORITY_LABELS[p]}
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
                name="age_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wiek od</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        placeholder="18"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wiek do</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        placeholder="23"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Pola „Noga wiodąca” oraz „Wymagania stylu gry” zostały usunięte z formularza. */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notatki</FormLabel>
                  <FormControl>
                    <textarea
                      rows={4}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Dodatkowe uwagi"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canEditStatus && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Otwarte</SelectItem>
                        <SelectItem value="in_progress">W trakcie</SelectItem>
                        <SelectItem value="filled">Wypełnione</SelectItem>
                        <SelectItem value="cancelled">Anulowane</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Zapisywanie…" : mode === "create" ? "Utwórz zapotrzebowanie" : "Zapisz zmiany"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
