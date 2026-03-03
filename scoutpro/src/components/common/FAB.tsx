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
  const isObservations = location.pathname.startsWith("/observations");

  if (isObservations) {
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
        <DropdownMenuContent side="top" align="end" className="mb-2 w-56">
          <DropdownMenuItem asChild>
            <Link to="/observations/match/new" className="flex cursor-pointer items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Obserwacja meczowa
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/observations/individual/new" className="flex cursor-pointer items-center gap-2">
              <User className="h-4 w-4" />
              Obserwacja indywidualna
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      to="/observations/new"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700 lg:hidden"
      aria-label="Dodaj obserwację"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
