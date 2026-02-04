import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Podaj poprawny email"),
  password: z.string().min(6, "Haslo musi miec min. 6 znakow"),
  remember: z.boolean().default(true),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginFormValues, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema) as Resolver<LoginFormValues>,
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password, values.remember);
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
        "/dashboard";
      navigate(from, { replace: true });
    } catch {
      setSubmitError("Nieprawidlowy email lub haslo");
    }
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
          name="remember"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal">Zapamietaj mnie</FormLabel>
            </FormItem>
          )}
        />

        {(submitError || error) && (
          <p className="text-sm text-red-600">{submitError ?? error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logowanie..." : "Zaloguj sie"}
        </Button>
      </form>
    </Form>
  );
}
