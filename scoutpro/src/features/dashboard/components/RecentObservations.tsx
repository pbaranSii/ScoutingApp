import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { useRecentObservations } from "../hooks/useDashboard";

export function RecentObservations() {
  const { data = [], isLoading } = useRecentObservations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ostatnie obserwacje</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-slate-500">Ladowanie...</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-slate-500">Brak obserwacji.</p>
        )}
        {data.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium text-slate-900">
                {item.player?.last_name} {item.player?.first_name}
              </div>
              <div className="text-xs text-slate-500">
                {item.observation_date
                  ? format(parseISO(item.observation_date), "dd.MM.yyyy")
                  : "-"}
              </div>
            </div>
            {item.rank && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {item.rank}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
