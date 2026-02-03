import { useNavigate } from "react-router-dom";
import { PlayerForm } from "@/features/players/components/PlayerForm";
import { Button } from "@/components/ui/button";

export function NewPlayerPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Nowy zawodnik</h1>
          <p className="text-sm text-slate-600">Wypelnij informacje o zawodniku.</p>
        </div>
        <Button variant="outline" type="button" onClick={() => navigate("/players")}>
          Wroc do listy
        </Button>
      </div>

      <PlayerForm onCreated={() => navigate("/players")} />
    </div>
  );
}
