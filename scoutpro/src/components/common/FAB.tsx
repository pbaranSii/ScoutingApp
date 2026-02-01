import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export function FAB() {
  return (
    <Link
      to="/observations/new"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 lg:hidden"
      aria-label="Dodaj obserwacje"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
