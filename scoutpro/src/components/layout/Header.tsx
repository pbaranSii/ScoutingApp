import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 lg:h-16">
      <div className="text-lg font-semibold text-slate-900">ScoutPro</div>
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
