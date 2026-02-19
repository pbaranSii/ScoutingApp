import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  KanbanSquare,
  CheckSquare,
  Settings,
  BarChart3,
  Heart,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { canViewAnalytics } from "@/features/users/types";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { data: profile } = useCurrentUserProfile();
  const showAnalytics = canViewAnalytics(profile?.business_role);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/players", label: "Zawodnicy", icon: Users },
    { to: "/observations", label: "Obserwacje", icon: ClipboardList },
    { to: "/favorites", label: "Ulubione", icon: Heart },
    { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
    { to: "/tasks", label: "Zadania", icon: CheckSquare },
    ...(showAnalytics
      ? [{ to: "/analytics/recruitment-pipeline", label: "Analytics", icon: BarChart3 }]
      : []),
    { to: "/settings", label: "Ustawienia", icon: Settings },
  ];

  return (
    <aside className="hidden h-full w-60 flex-shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex flex-1 flex-col gap-6 min-h-0">
          <div className="flex items-center gap-3 flex-shrink-0">
            <img
              src={logo}
              alt="Logo ScoutPro"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div className="text-sm font-semibold text-slate-900">ScoutPro</div>
              <div className="text-xs text-slate-500">System scoutingowy</div>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 flex-shrink-0">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Online
          </div>

          <nav className="flex flex-col gap-2 min-h-0 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition flex-shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto flex flex-shrink-0 flex-col gap-3 border-t border-slate-200 pt-4">
          <div className="min-w-0 rounded-md bg-slate-50 px-3 py-2">
            <div className="truncate text-sm font-medium text-slate-900">
              {profile?.full_name?.trim() || "Zalogowany użytkownik"}
            </div>
            <div className="truncate text-xs text-slate-500">{user?.email ?? "—"}</div>
          </div>
          <Button variant="outline" onClick={logout} className="w-full">
            Wyloguj się
          </Button>
        </div>
      </div>
    </aside>
  );
}
