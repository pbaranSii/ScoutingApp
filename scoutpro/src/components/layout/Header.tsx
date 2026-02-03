import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <img
          src={logo}
          alt="Logo ScoutPro"
          className="h-8 w-8 rounded-full object-cover"
        />
        <div>
          <div className="text-sm font-semibold text-slate-900">ScoutPro</div>
          <div className="text-[11px] text-slate-500">System scoutingowy</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
          <User className="h-4 w-4" />
          <span>{user?.email ?? "Uzytkownik"}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Wyloguj">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
