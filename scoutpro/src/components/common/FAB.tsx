import { Link, useLocation } from "react-router-dom";
import { Plus, ClipboardList, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FAB() {
  const location = useLocation();
  const pathname = location.pathname;
  const showFab =
    pathname === "/observations" ||
    pathname === "/observations/match/new" ||
    !pathname.startsWith("/observations");

  if (!showFab) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 lg:hidden"
          aria-label="Dodaj obserwację"
        >
          <Plus className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="mb-2 w-56 p-2">
        <DropdownMenuItem asChild className="min-h-[48px] cursor-pointer py-3 px-3 text-base">
          <Link to="/observations/match/new" className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 shrink-0" />
            Obserwacja meczowa
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-[48px] cursor-pointer py-3 px-3 text-base">
          <Link to="/observations/new" className="flex items-center gap-2">
            <User className="h-5 w-5 shrink-0" />
            Obserwacja indywidualna
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
