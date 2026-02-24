import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

const schema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(8, "Powtórz hasło"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Hasla musza byc takie same",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof schema>;

type ChangePasswordFormProps = {
  onSuccess?: () => void;
};

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      toast({
        variant: "destructive",
        title: "Nie udało się zmienić hasła",
        description: error.message,
      });
      setIsSubmitting(false);
      return;
    }
    toast({ title: "Hasło zostało zmienione" });
    form.reset();
    setIsSubmitting(false);
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nowe hasło</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Min. 8 znaków" {...field} />
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
              <FormLabel>Powtórz hasło</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Powtórz hasło" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Zmień hasło
        </Button>
      </form>
    </Form>
  );
}
