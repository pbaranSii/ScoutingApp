import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, ClipboardList, KanbanSquare, Settings } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/players", label: "Zawodnicy", icon: Users },
  { to: "/observations", label: "Obserwacje", icon: ClipboardList },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/settings", label: "Ustawienia", icon: Settings },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white lg:hidden">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium",
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
