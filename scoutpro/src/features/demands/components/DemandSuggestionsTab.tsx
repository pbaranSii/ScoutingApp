import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDemandSuggestions, useAddCandidate } from "@/features/demands/hooks";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type DemandSuggestionsTabProps = {
  demandId: string;
};

export function DemandSuggestionsTab({ demandId }: DemandSuggestionsTabProps) {
  const { data: suggestions = [], isLoading } = useDemandSuggestions(demandId);
  const addCandidate = useAddCandidate(demandId);

  const handleAdd = async (playerId: string, playerName: string) => {
    try {
      await addCandidate.mutateAsync({
        playerId,
        assignmentType: "suggested",
      });
      toast({ title: `Dodano ${playerName} do zapotrzebowania` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się dodać kandydata.",
      });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ładowanie sugestii…</p>;
  }
  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Brak sugerowanych zawodników (pozycja i wiek w zakresie). Zmień kryteria zapotrzebowania lub dodaj kandydatów ręcznie z listy zawodników.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-2 py-1.5 text-left font-medium text-slate-700">Zawodnik</th>
            <th className="px-2 py-1.5 text-left font-medium text-slate-700">Pozycja</th>
            <th className="px-2 py-1.5 text-left font-medium text-slate-700">Rok ur.</th>
            <th className="px-2 py-1.5 text-left font-medium text-slate-700">Klub</th>
            <th className="px-2 py-1.5 text-left font-medium text-slate-700">Dopasowanie</th>
            <th className="px-2 py-1.5 w-24" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {suggestions.map((p) => {
            const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—";
            const clubName = (p.club as { name?: string })?.name ?? "—";
            return (
              <tr key={p.id}>
                <td className="px-2 py-1.5 font-medium">
                  <Link to={`/players/${p.id}`} className="text-primary hover:underline">
                    {name}
                  </Link>
                </td>
                <td className="px-2 py-1.5 text-slate-600">{p.primary_position ?? "—"}</td>
                <td className="px-2 py-1.5 text-slate-600">{p.birth_year}</td>
                <td className="px-2 py-1.5 text-slate-600">{clubName}</td>
                <td className="px-2 py-1.5 text-slate-600">100%</td>
                <td className="px-2 py-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleAdd(p.id, name)}
                    disabled={addCandidate.isPending}
                  >
                    <Plus className="h-4 w-4" />
                    Dodaj
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
