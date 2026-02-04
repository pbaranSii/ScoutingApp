import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePipelineHistory, useCreatePlayer, useUpdatePlayer } from "../hooks/usePlayers";
import type { DominantFoot, PipelineStatus } from "../types";
import { ClubSelect } from "./ClubSelect";
import { PositionPickerDialog } from "@/features/players/components/PositionPickerDialog";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PIPELINE_COLUMNS } from "@/features/pipeline/types";
import { POSITION_OPTIONS, mapLegacyPosition } from "@/features/players/positions";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().positive().optional()
);

const playerSchema = z.object({
  first_name: z.string().min(2, "Podaj imie"),
  last_name: z.string().min(2, "Podaj nazwisko"),
  birth_year: z.coerce.number().int().min(2000).max(2030),
  nationality: optionalText,
  club_name: optionalText,
  primary_position: optionalText,
  dominant_foot: optionalText,
  pipeline_status: optionalText,
  height_cm: optionalNumber,
  weight_kg: optionalNumber,
  guardian_name: optionalText,
  guardian_phone: optionalText,
  guardian_email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email("Podaj poprawny email").optional()
  ),
  photo_url: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url("Podaj poprawny URL").optional()
  ),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

type PlayerFormProps = {
  mode?: "create" | "edit";
  playerId?: string;
  initialValues?: Partial<PlayerFormValues>;
  onCreated?: () => void;
  onUpdated?: () => void;
};

export function PlayerForm({
  mode = "create",
  playerId,
  initialValues,
  onCreated,
  onUpdated,
}: PlayerFormProps) {
  const isEdit = mode === "edit";
  const navigate = useNavigate();
  const { mutateAsync: createPlayer, isPending: isCreating } = useCreatePlayer();
  const { mutateAsync: updatePlayer, isPending: isUpdating } = useUpdatePlayer();
  const { mutateAsync: createHistory } = useCreatePipelineHistory();
  const { user } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo(() => {
    const normalizedInitial: PlayerFormValues = {
      ...initialValues,
      first_name: initialValues?.first_name ?? "",
      last_name: initialValues?.last_name ?? "",
      birth_year: initialValues?.birth_year ?? new Date().getFullYear() - 14,
      nationality: initialValues?.nationality ?? "",
      club_name: initialValues?.club_name ?? "",
      primary_position: mapLegacyPosition(initialValues?.primary_position ?? ""),
      dominant_foot: initialValues?.dominant_foot ?? "",
      pipeline_status: initialValues?.pipeline_status ?? "observed",
      height_cm: initialValues?.height_cm ?? undefined,
      weight_kg: initialValues?.weight_kg ?? undefined,
      guardian_name: initialValues?.guardian_name ?? "",
      guardian_phone: initialValues?.guardian_phone ?? "",
      guardian_email: initialValues?.guardian_email ?? "",
      photo_url: initialValues?.photo_url ?? "",
    };

    const defaults: PlayerFormValues = {
      first_name: "",
      last_name: "",
      birth_year: new Date().getFullYear() - 14,
      nationality: "",
      club_name: "",
      primary_position: "",
      dominant_foot: "",
      pipeline_status: "observed",
      height_cm: undefined,
      weight_kg: undefined,
      guardian_name: "",
      guardian_phone: "",
      guardian_email: "",
      photo_url: "",
    };

    return {
      ...defaults,
      ...normalizedInitial,
      primary_position: mapLegacyPosition(normalizedInitial.primary_position ?? ""),
    };
  }, [initialValues]);

  const form = useForm<PlayerFormValues, unknown, PlayerFormValues>({
    resolver: zodResolver(playerSchema) as Resolver<PlayerFormValues>,
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const resolveClubId = async (clubName?: string) => {
    if (!clubName) return null;
    const { data: existing } = await supabase
      .from("clubs")
      .select("id")
      .eq("name", clubName)
      .maybeSingle();

    if (existing?.id) {
      return existing.id as string;
    }
    throw new Error(
      "Brak uprawnien do dodania klubu. Wybierz istniejacy klub lub zostaw pole puste."
    );
  };

  const onSubmit = async (values: PlayerFormValues) => {
    setSubmitError(null);
    try {
      const clubId = await resolveClubId(values.club_name?.trim());
      const toNullable = (value?: string) =>
        typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
      const toNullableNumber = (value?: number) =>
        typeof value === "number" && !Number.isNaN(value) ? value : null;
      const dominantFoot = values.dominant_foot
        ? (values.dominant_foot as DominantFoot)
        : null;
      const pipelineStatus = values.pipeline_status
        ? (values.pipeline_status as PipelineStatus)
        : undefined;
      const input = {
        first_name: values.first_name,
        last_name: values.last_name,
        birth_year: values.birth_year,
        club_id: clubId ?? null,
        nationality: toNullable(values.nationality),
        primary_position: toNullable(values.primary_position),
        dominant_foot: dominantFoot,
        pipeline_status: pipelineStatus ?? "observed",
        height_cm: toNullableNumber(values.height_cm),
        weight_kg: toNullableNumber(values.weight_kg),
        guardian_name: toNullable(values.guardian_name),
        guardian_phone: toNullable(values.guardian_phone),
        guardian_email: toNullable(values.guardian_email),
        photo_urls: values.photo_url?.trim() ? [values.photo_url.trim()] : null,
      };

      if (isEdit) {
        if (!playerId) {
          throw new Error("Brak identyfikatora zawodnika do aktualizacji.");
        }
        await updatePlayer({ id: playerId, input });
        if (user?.id && pipelineStatus && pipelineStatus !== initialValues?.pipeline_status) {
          try {
            await createHistory({
              player_id: playerId,
              from_status: initialValues?.pipeline_status ?? null,
              to_status: pipelineStatus,
              changed_by: user.id,
            });
          } catch (error) {
            console.warn("Pipeline history insert blocked:", error);
          }
        }
        toast({
          title: "Zapisano zmiany",
          description: "Profil zawodnika zostal zaktualizowany.",
        });
        onUpdated?.();
      } else {
        const created = await createPlayer(input);
        if (user?.id && input.pipeline_status) {
          try {
            await createHistory({
              player_id: created.id,
              from_status: null,
              to_status: input.pipeline_status,
              changed_by: user.id,
            });
          } catch (error) {
            console.warn("Pipeline history insert blocked:", error);
          }
        }
        toast({
          title: "Zapisano zawodnika",
          description: "Nowy zawodnik zostal dodany.",
        });
        form.reset();
        onCreated?.();
      }
    } catch (error) {
      const message = extractErrorMessage(error, "Nie udalo sie zapisac zawodnika");
      console.error("Save player failed:", error);
      setSubmitError(message);
      toast({
        variant: "destructive",
        title: "Nie udalo sie zapisac",
        description: message,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Dane podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imie *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwisko *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kowalski" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birth_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rok urodzenia *</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narodowosc</FormLabel>
                    <FormControl>
                      <Input placeholder="Polska" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Pozycja i klub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="primary_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pozycja</FormLabel>
                    <div className="flex items-center gap-2">
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Wybierz pozycje" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POSITION_OPTIONS.map((option) => (
                            <SelectItem key={option.code} value={option.code}>
                              {option.label} ({option.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <PositionPickerDialog value={field.value} onSelect={field.onChange} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="club_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktualny klub</FormLabel>
                    <FormControl>
                      <ClubSelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Wybierz klub"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="pipeline_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status w pipeline</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PIPELINE_COLUMNS.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Parametry fizyczne</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="height_cm"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                <FormItem>
                  <FormLabel>Wzrost (cm)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" value={value ?? ""} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                <FormItem>
                  <FormLabel>Waga (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" value={value ?? ""} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="dominant_foot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferowana noga</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="right">Prawa</SelectItem>
                      <SelectItem value="left">Lewa</SelectItem>
                      <SelectItem value="both">Obie</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Dane kontaktowe (opcjonalne)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="guardian_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rodzic/Opiekun</FormLabel>
                    <FormControl>
                      <Input placeholder="Adam Kowalski" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guardian_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+48 600 123 456" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="guardian_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="adam.kowalski@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6">
            <CardTitle className="text-base">Zdjecie (opcjonalnie)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-6">
            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL zdjecia</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/photo.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-slate-500">Wklej link do zdjecia zawodnika.</p>
          </CardContent>
        </Card>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/players/${playerId ?? ""}` : "/players")}
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating
              ? "Zapisywanie..."
              : isEdit
                ? "Zapisz zmiany"
                : "Zapisz zawodnika"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}
