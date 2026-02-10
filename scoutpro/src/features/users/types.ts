import type { Tables } from "@/types/database.types";

export type UserProfile = Tables<"users">;

export type BusinessRole = "scout" | "coach" | "director" | "suspended" | "admin";

export const BUSINESS_ROLE_LABELS: Record<BusinessRole, { label: string; description: string }> = {
  scout: { label: "Scout", description: "Obserwacje i raporty zawodników" },
  coach: { label: "Trener", description: "Dostęp do obserwacji i zarządzanie treningami" },
  director: {
    label: "Dyrektor Sportowy",
    description: "Pełny dostęp do pipeline i decyzji rekrutacyjnych",
  },
  suspended: { label: "Zawieszony", description: "Brak dostępu do aplikacji" },
  admin: { label: "Administrator", description: "Pełna kontrola nad systemem i użytkownikami" },
};
