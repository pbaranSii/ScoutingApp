import type { Tables } from "@/types/database.types";

export type UserProfile = Tables<"users">;

export type BusinessRole = "scout" | "coach" | "director" | "suspended" | "admin";

/** Role uprawnione do modułu Analytics (lejka rekrutacji). Zgodne z mapowaniem w DEPLOY_ANALYTICS.md. */
export const ROLES_CAN_VIEW_ANALYTICS: readonly BusinessRole[] = [
  "scout",
  "coach",
  "director",
  "admin",
] as const;

export function canViewAnalytics(role: BusinessRole | undefined): boolean {
  return role != null && ROLES_CAN_VIEW_ANALYTICS.includes(role);
}

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
