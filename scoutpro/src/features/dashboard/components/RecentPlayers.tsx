import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentPlayers } from "../hooks/useDashboard";

export function RecentPlayers() {
  const { data = [], isLoading } = useRecentPlayers(8);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Ostatnio zarejestrowani zawodnicy</CardTitle>
        <Link
          to="/players"
          className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
        >
          Zobacz wszystkie
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-slate-500">Ładowanie...</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-slate-500">Brak zawodników.</p>
        )}
        {data.map((player) => (
          <Link
            key={player.id}
            to={`/players/${player.id}`}
            className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-50"
          >
            <div className="font-medium text-slate-900">
              {player.last_name} {player.first_name}
            </div>
            <div className="text-xs text-slate-500">
              {player.birth_year}
              {player.primary_position ? ` · ${player.primary_position}` : ""}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
