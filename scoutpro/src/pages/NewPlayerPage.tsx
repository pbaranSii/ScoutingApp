import { useNavigate } from "react-router-dom";
import { PlayerForm } from "@/features/players/components/PlayerForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NewPlayerPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Nowy zawodnik</h1>
          <p className="text-sm text-slate-600">Dodaj zawodnika do bazy scoutingowej.</p>
        </div>
        <Button variant="outline" type="button" onClick={() => navigate("/players")}>
          Wroc do listy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dane zawodnika</CardTitle>
          <CardDescription>Wypelnij dane i zapisz, aby dodac zawodnika.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerForm onCreated={() => navigate("/players")} />
        </CardContent>
      </Card>
    </div>
  );
}
