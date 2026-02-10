import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  email: z.string().email("Podaj poprawny email"),
});

type InviteValues = z.infer<typeof schema>;

type InviteFormProps = {
  onSuccess?: () => void;
};

export function InviteForm({ onSuccess }: InviteFormProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<InviteValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: InviteValues) => {
    setStatus("idle");
    setErrorMessage(null);
    await supabase.auth.refreshSession();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setStatus("error");
      setErrorMessage("Zaloguj sie ponownie i sprobuj jeszcze raz.");
      return;
    }
    const redirectTo = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/set-new-password`;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const res = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ email: values.email, redirectTo }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const msg = body?.error;

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(
        msg ?? `Blad ${res.status}. Zaloguj sie ponownie lub skontaktuj sie z administratorem.`
      );
      return;
    }

    setStatus("success");
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email zapraszanego</FormLabel>
              <FormControl>
                <Input type="email" placeholder="nowy@scoutpro.pl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {status === "success" && (
          <p className="text-sm text-green-600">Zaproszenie wyslane.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <Button type="submit" className="w-full">
          Wyslij zaproszenie
        </Button>
      </form>
    </Form>
  );
}
