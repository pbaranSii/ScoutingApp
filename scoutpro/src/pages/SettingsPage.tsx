import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import {
  BarChart3,
  BarChart2,
  BookOpen,
  ChevronRight,
  Star,
  Users,
  LayoutGrid,
} from "lucide-react";

const SETTING_ITEMS = [
  {
    to: "/settings/users",
    label: "Użytkownicy",
    description: "Zarządzaj dostępem i danymi użytkowników.",
    icon: Users,
    adminOnly: true,
  },
  {
    to: "/settings/dictionaries",
    label: "Słowniki",
    description: "Zarządzaj słownikami używanymi w formularzach.",
    icon: BookOpen,
    adminOnly: false,
  },
  {
    to: "/settings/form-templates",
    label: "Wzory formularzy pozycji",
    description: "Zarządzaj wzorami formularzy opisu pozycji (sekcja 4b).",
    icon: BookOpen,
    adminOnly: true,
  },
  {
    to: "/admin/settings/analytics",
    label: "Analytics Settings",
    description: "Cele, limity i sezon dla Recruitment Analytics.",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    to: "/settings/admin/usage-statistics",
    label: "Statystyki użytkowników",
    description: "Monitoruj aktywność i wykorzystanie systemu.",
    icon: BarChart2,
    adminOnly: true,
  },
  {
    to: "/settings/admin/user-satisfaction",
    label: "Ankiety satysfakcji",
    description: "Przeglądaj opinie użytkowników.",
    icon: Star,
    adminOnly: true,
  },
  {
    to: "/settings/tactical/formations",
    label: "Schematy taktyczne",
    description: "Schematy taktyczne (formacje) używane w modułach obserwacji.",
    icon: LayoutGrid,
    adminOnly: true,
  },
] as const;

export function SettingsPage() {
  const { data: currentUser } = useCurrentUserProfile();
  const isAdmin = currentUser?.role === "admin";

  const items = SETTING_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ustawienia"
        subtitle="Wybierz funkcję do zarządzania aplikacją."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to}>
              <Card className="transition-colors hover:bg-slate-50">
                <CardContent className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
