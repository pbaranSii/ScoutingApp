import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePlayer, useUpdatePlayer } from "../hooks/usePlayers";
import { ClubSelect } from "./ClubSelect";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PIPELINE_COLUMNS } from "@/features/pipeline/types";

const playerSchema = z.object({
  first_name: z.string().min(2, "Podaj imie"),
  last_name: z.string().min(2, "Podaj nazwisko"),
  birth_year: z.coerce.number().int().min(2000).max(2030),
  club_name: z.string().optional(),
  primary_position: z.string().optional(),
  dominant_foot: z.string().optional(),
  pipeline_status: z.string().optional(),
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
  const { mutateAsync: createPlayer, isPending: isCreating } = useCreatePlayer();
  const { mutateAsync: updatePlayer, isPending: isUpdating } = useUpdatePlayer();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo(
    () => ({
      first_name: "",
      last_name: "",
      birth_year: new Date().getFullYear() - 14,
      club_name: "",
      primary_position: "",
      dominant_foot: "",
      pipeline_status: "observed",
      ...initialValues,
    }),
    [initialValues]
  );

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
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
      const input = {
        first_name: values.first_name,
        last_name: values.last_name,
        birth_year: values.birth_year,
        club_id: clubId ?? null,
        primary_position: values.primary_position || undefined,
        dominant_foot: values.dominant_foot || undefined,
        pipeline_status: values.pipeline_status || undefined,
      };

      if (isEdit) {
        if (!playerId) {
          throw new Error("Brak identyfikatora zawodnika do aktualizacji.");
        }
        await updatePlayer({ id: playerId, input });
        onUpdated?.();
      } else {
        await createPlayer({
          ...input,
          pipeline_status: "observed",
        });
        form.reset();
        onCreated?.();
      }
    } catch (error) {
      const message = extractErrorMessage(error, "Nie udalo sie zapisac zawodnika");
      console.error("Save player failed:", error);
      setSubmitError(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        <FormField
          control={form.control}
          name="birth_year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rocznik *</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="club_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Klub</FormLabel>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="primary_position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pozycja</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz pozycje" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">GK</SelectItem>
                    <SelectItem value="4">CB</SelectItem>
                    <SelectItem value="2">RB</SelectItem>
                    <SelectItem value="3">LB</SelectItem>
                    <SelectItem value="6">CDM</SelectItem>
                    <SelectItem value="8">CM</SelectItem>
                    <SelectItem value="10">CAM</SelectItem>
                    <SelectItem value="7">RW</SelectItem>
                    <SelectItem value="11">LW</SelectItem>
                    <SelectItem value="9">ST</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dominant_foot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Noga dominujaca</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
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
          {isEdit && (
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
          )}
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button type="submit" className="w-full" disabled={isCreating || isUpdating}>
          {isCreating || isUpdating
            ? "Zapisywanie..."
            : isEdit
              ? "Zapisz zmiany"
              : "Dodaj zawodnika"}
        </Button>
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
