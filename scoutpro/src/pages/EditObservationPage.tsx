import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useObservation, useUpdateObservation } from "@/features/observations/hooks/useObservations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  observation_date: z.string().min(1, "Podaj date"),
  source: z.string().min(1, "Wybierz zrodlo"),
  rank: z.string().optional(),
  potential_now: z.coerce.number().int().min(1).max(5).optional(),
  potential_future: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditObservationPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const observationId = id ?? "";
  const { data: observation, isLoading } = useObservation(observationId);
  const { mutateAsync: updateObservation, isPending } = useUpdateObservation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      observation_date: "",
      source: "",
      rank: "",
      potential_now: 3,
      potential_future: 3,
      notes: "",
    },
  });

  useEffect(() => {
    if (!observation) return;
    form.reset({
      observation_date: observation.observation_date ?? "",
      source: observation.source ?? "",
      rank: observation.rank ?? "",
      potential_now: observation.potential_now ?? 3,
      potential_future: observation.potential_future ?? 3,
      notes: observation.notes ?? "",
    });
  }, [observation, form]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!observation) {
    return <p className="text-sm text-slate-500">Nie znaleziono obserwacji.</p>;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await updateObservation({
        id: observation.id,
        input: {
          observation_date: values.observation_date,
          source: values.source,
          rank: values.rank || null,
          potential_now: values.potential_now ?? null,
          potential_future: values.potential_future ?? null,
          notes: values.notes || null,
        },
      });
      navigate(`/observations/${observation.id}`);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nie udalo sie zapisac obserwacji";
      window.alert(message);
      console.error("Update observation failed:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Edytuj obserwacje</h1>
          <p className="text-sm text-slate-600">
            {observation.player?.last_name} {observation.player?.first_name}
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => navigate(`/observations/${observation.id}`)}>
          Wroc do szczegolow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dane obserwacji</CardTitle>
          <CardDescription>Wprowadz zmiany i kliknij zapisz.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="observation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data obserwacji *</FormLabel>
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
                    <FormLabel>Zrodlo *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz zrodlo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scouting">Skauting</SelectItem>
                        <SelectItem value="referral">Polecenie</SelectItem>
                        <SelectItem value="application">Zgloszenie</SelectItem>
                        <SelectItem value="trainer_report">Raport trenera</SelectItem>
                        <SelectItem value="scout_report">Raport skauta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ranga</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">A - TOP</SelectItem>
                        <SelectItem value="B">B - Dobry</SelectItem>
                        <SelectItem value="C">C - Szeroka kadra</SelectItem>
                        <SelectItem value="D">D - Slaby</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="potential_now"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potencjal teraz (1-5)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={5} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="potential_future"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potencjal przyszly (1-5)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={5} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Komentarz</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Krotki opis" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending}>
                {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
