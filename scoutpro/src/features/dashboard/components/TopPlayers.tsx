import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopRankedPlayers } from "../hooks/useDashboard";

export function TopPlayers() {
  const { data = [], isLoading } = useTopRankedPlayers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top zawodnicy (Ranga A)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-slate-500">Ladowanie...</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-slate-500">Brak danych.</p>
        )}
        {data.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium text-slate-900">
                {item.player?.last_name} {item.player?.first_name}
              </div>
              <div className="text-xs text-slate-500">
                {item.player?.birth_year ?? "-"}
              </div>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              A
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
