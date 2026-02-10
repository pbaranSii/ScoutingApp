import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUSINESS_ROLE_LABELS, type BusinessRole } from "../types";

const baseSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email("Podaj poprawny email"),
  business_role: z.enum(["scout", "coach", "director", "suspended", "admin"]),
  password: z.string().min(8, "Haslo musi miec co najmniej 8 znakow").optional(),
});

const createSchema = baseSchema.extend({
  first_name: z.string().min(1, "Podaj imie"),
  last_name: z.string().min(1, "Podaj nazwisko"),
});

export type UserFormValues = z.infer<typeof baseSchema> & {
  first_name: string;
  last_name: string;
};

type UserFormProps = {
  defaultValues: UserFormValues;
  onSubmit: (values: UserFormValues) => Promise<void>;
  submitLabel: string;
  includePassword?: boolean;
  isSubmitting?: boolean;
};

export function UserForm({
  defaultValues,
  onSubmit,
  submitLabel,
  includePassword = false,
  isSubmitting = false,
}: UserFormProps) {
  const schema = useMemo(() => {
    if (includePassword) {
      return createSchema.extend({
        password: z.string().min(8, "Haslo musi miec co najmniej 8 znakow"),
      });
    }
    return baseSchema;
  }, [includePassword]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const roleOptions = Object.entries(BUSINESS_ROLE_LABELS) as [
    BusinessRole,
    { label: string; description: string },
  ][];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imie</FormLabel>
                <FormControl>
                  <Input placeholder="Jan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwisko</FormLabel>
                <FormControl>
                  <Input placeholder="Kowalski" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="uzytkownik@scoutpro.pl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="business_role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rola (informacyjna)</FormLabel>
              <p className="text-xs text-slate-500 mb-1">
                Okresla funkcje uzytkownika w systemie (np. Scout, Trener, Administrator). Na razie sluzy tylko do informacji.
              </p>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent
                  side="top"
                  sideOffset={4}
                  className="z-[90] max-h-[var(--radix-select-content-available-height)]"
                >
                  {roleOptions.map(([value, { label, description }]) => (
                    <SelectItem key={value} value={value}>
                      {label} - {description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {includePassword && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Haslo</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Min. 8 znakow" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
