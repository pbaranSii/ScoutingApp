import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentDemands } from "../hooks/useDashboard";

export function RecentDemandsCard() {
  const { data = [], isLoading } = useRecentDemands(5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Zapotrzebowania</CardTitle>
        <Link
          to="/demands"
          className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
        >
          Zobacz wszystkie
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-slate-500">Ładowanie...</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-slate-500">Brak zapotrzebowań.</p>
        )}
        {data.map((d) => (
          <Link
            key={d.id}
            to={`/demands/${d.id}`}
            className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-50"
          >
            <div className="font-medium text-slate-900">
              {d.positions?.length ? d.positions.join(", ") : d.position || "-"}
            </div>
            <div className="text-xs text-slate-500">
              {d.club?.name ?? "—"} · {d.season}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
