import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePlayer } from "../hooks/usePlayers";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const playerSchema = z.object({
  first_name: z.string().min(2, "Podaj imie"),
  last_name: z.string().min(2, "Podaj nazwisko"),
  birth_year: z.coerce.number().int().min(2000).max(2030),
  club_name: z.string().optional(),
  primary_position: z.string().optional(),
  dominant_foot: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

type PlayerFormProps = {
  onCreated?: () => void;
};

export function PlayerForm({ onCreated }: PlayerFormProps) {
  const { mutateAsync, isPending } = useCreatePlayer();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      birth_year: new Date().getFullYear() - 14,
      club_name: "",
      primary_position: "",
      dominant_foot: "",
    },
  });

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

    const { data: created, error } = await supabase
      .from("clubs")
      .insert({ name: clubName })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return created.id as string;
  };

  const onSubmit = async (values: PlayerFormValues) => {
    setSubmitError(null);
    try {
      const clubId = await resolveClubId(values.club_name?.trim());
      await mutateAsync({
        first_name: values.first_name,
        last_name: values.last_name,
        birth_year: values.birth_year,
        club_id: clubId,
        primary_position: values.primary_position || undefined,
        dominant_foot: values.dominant_foot || undefined,
        pipeline_status: "observed",
      });
      form.reset();
      onCreated?.();
    } catch {
      setSubmitError("Nie udalo sie zapisac zawodnika");
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
                <Input placeholder="Chemik Bydgoszcz" {...field} />
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
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Zapisywanie..." : "Dodaj zawodnika"}
        </Button>
      </form>
    </Form>
  );
}
