import { Link } from "react-router-dom";
import { LogOut, User, Settings, Star, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden max-w-[120px] truncate sm:inline">{user?.email ?? "Użytkownik"}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex cursor-pointer items-center gap-2">
                <Settings className="h-4 w-4" />
                Ustawienia
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/survey/satisfaction" className="flex cursor-pointer items-center gap-2">
                <Star className="h-4 w-4" />
                Oceń aplikację
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void logout()} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Wyloguj się
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
