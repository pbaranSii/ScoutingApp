import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Strona nie znaleziona</h1>
      <Button asChild>
        <Link to="/dashboard">Wroc do dashboardu</Link>
      </Button>
    </div>
  );
}
