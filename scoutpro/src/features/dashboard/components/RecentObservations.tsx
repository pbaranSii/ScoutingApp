import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { useRecentObservations } from "../hooks/useDashboard";

export function RecentObservations() {
  const { data = [], isLoading } = useRecentObservations(5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Ostatnie obserwacje</CardTitle>
        <Link
          to="/observations"
          className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
        >
          Zobacz wszystkie
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-slate-500">Ładowanie...</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-slate-500">Brak obserwacji.</p>
        )}
        {data.map((item) => (
          <Link
            key={item.id}
            to={`/observations/${item.id}`}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-50"
          >
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
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
