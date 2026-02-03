import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, ClipboardList, KanbanSquare, Settings } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/players", label: "Zawodnicy", icon: Users },
  { to: "/observations", label: "Obserwacje", icon: ClipboardList },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/settings", label: "Ustawienia", icon: Settings },
];

export function Sidebar() {
  const { logout } = useAuthStore();

  return (
    <aside className="hidden w-60 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col justify-between p-4">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
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

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Online
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition",
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

        <Button variant="outline" onClick={logout}>
          Wyloguj sie
        </Button>
      </div>
    </aside>
  );
}
