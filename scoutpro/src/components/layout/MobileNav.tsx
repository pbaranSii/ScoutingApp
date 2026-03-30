import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  KanbanSquare,
  CheckSquare,
  Settings,
  BarChart3,
  Target,
  MoreHorizontal,
} from "lucide-react";
import { ShadowTeamIcon } from "@/components/icons/ShadowTeamIcon";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { canViewAnalytics, canAccessSettings, canAccessPipeline } from "@/features/users/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAIN_NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/players", label: "Zawodnicy", icon: Users },
  { to: "/observations", label: "Obserwacje", icon: ClipboardList },
  { to: "/tasks", label: "Zadania", icon: CheckSquare },
] as const;

export function MobileNav() {
  const navigate = useNavigate();
  const { data: profile } = useCurrentUserProfile();
  const showAnalytics = canViewAnalytics(profile?.business_role);
  const showSettings = canAccessSettings(profile?.business_role);
  const showPipeline = canAccessPipeline(profile?.business_role);

  const moreItems = [
    { to: "/favorites", label: "Shadow Team", icon: ShadowTeamIcon },
    { to: "/demands", label: "Zapotrzebowania", icon: Target },
    ...(showPipeline ? [{ to: "/pipeline", label: "Pipeline", icon: KanbanSquare }] : []),
    ...(showAnalytics
      ? [{ to: "/analytics/recruitment-pipeline", label: "Analytics", icon: BarChart3 }]
      : []),
    ...(showSettings ? [{ to: "/settings", label: "Ustawienia", icon: Settings }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white lg:hidden">
      <div className="flex items-stretch justify-between gap-1 px-2 py-2">
        {MAIN_NAV.map(({ to, label, icon: Icon }) => (
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium text-slate-500"
              aria-label="Więcej"
            >
              <MoreHorizontal className="h-5 w-5" />
              Więcej
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="mb-2 w-56">
            {moreItems.map(({ to, label, icon: Icon }) => (
              <DropdownMenuItem
                key={to}
                onSelect={() => navigate(to)}
                className="flex cursor-pointer items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
