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
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { canViewAnalytics } from "@/features/users/types";

export function MobileNav() {
  const { data: profile } = useCurrentUserProfile();
  const showAnalytics = canViewAnalytics(profile?.business_role);

  const navItems = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
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
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white lg:hidden">
      <div className="flex items-stretch justify-between gap-1 px-2 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium",
                isActive ? "text-red-600" : "text-slate-500",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
