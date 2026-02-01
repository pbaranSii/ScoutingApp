import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z
  .object({
    password: z.string().min(6, "Haslo musi miec min. 6 znakow"),
    confirmPassword: z.string().min(6, "Powtorz haslo"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasla musza byc takie same",
    path: ["confirmPassword"],
  });

type SetPasswordValues = z.infer<typeof schema>;

export function SetNewPasswordForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: SetPasswordValues) => {
    setStatus("idle");
    setErrorMessage(null);
    const { error } = await supabase.auth.updateUser({
      password: values.password,
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nowe haslo</FormLabel>
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
          <p className="text-sm text-green-600">Haslo zostalo zmienione.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <Button type="submit" className="w-full">
          Zmien haslo
        </Button>
      </form>
    </Form>
  );
}
