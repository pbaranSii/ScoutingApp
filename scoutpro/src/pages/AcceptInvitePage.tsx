import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z
  .object({
    full_name: z.string().min(2, "Podaj imie i nazwisko"),
    password: z.string().min(6, "Haslo musi miec min. 6 znakow"),
    confirmPassword: z.string().min(6, "Powtorz haslo"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasla musza byc takie same",
    path: ["confirmPassword"],
  });

type AcceptInviteValues = z.infer<typeof schema>;

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<AcceptInviteValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: AcceptInviteValues) => {
    setStatus("idle");
    setErrorMessage(null);
    if (!token) {
      setStatus("error");
      setErrorMessage("Brak tokenu zaproszenia");
      return;
    }
    const { error } = await supabase.functions.invoke("accept-invitation", {
      body: {
        token,
        password: values.password,
        full_name: values.full_name,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("success");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">ScoutPro</div>
          <p className="mt-1 text-sm text-slate-600">Akceptuj zaproszenie</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Ustaw haslo</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imie i nazwisko</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan Nowak" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Haslo</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Powtorz haslo</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {status === "success" && (
                  <p className="text-sm text-green-600">
                    Konto aktywowane. Mozesz sie zalogowac.
                  </p>
                )}
                {status === "error" && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}
                <Button type="submit" className="w-full">
                  Akceptuj zaproszenie
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
