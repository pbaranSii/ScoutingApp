import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, ClipboardList, KanbanSquare, Settings } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/players", label: "Zawodnicy", icon: Users },
  { to: "/observations", label: "Obserwacje", icon: ClipboardList },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/settings", label: "Ustawienia", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 border-r bg-white lg:block">
      <nav className="flex h-full flex-col gap-1 p-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100",
              ].join(" ")
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
