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

type ResetPasswordValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setStatus("idle");
    setErrorMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/set-new-password`,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("success");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="scout@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {status === "success" && (
          <p className="text-sm text-green-600">
            Wyslano link do resetu hasla.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <Button type="submit" className="w-full">
          Wyslij link
        </Button>
      </form>
    </Form>
  );
}
