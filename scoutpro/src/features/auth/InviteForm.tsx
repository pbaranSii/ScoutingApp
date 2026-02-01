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

export function InviteForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<InviteValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: InviteValues) => {
    setStatus("idle");
    setErrorMessage(null);
    const { error } = await supabase.functions.invoke("send-invitation", {
      body: { email: values.email },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("success");
    form.reset();
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
