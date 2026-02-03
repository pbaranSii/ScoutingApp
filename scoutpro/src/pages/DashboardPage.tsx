import { Link } from "react-router-dom";
import { StatsWidget } from "@/features/dashboard/components/StatsWidget";
import { PipelineSummary } from "@/features/dashboard/components/PipelineSummary";
import {
  useObservationStats,
  usePlayerCount,
  usePlayersByStatus,
} from "@/features/dashboard/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Eye, Users } from "lucide-react";

export function DashboardPage() {
  const { data, isLoading } = useObservationStats();
  const { data: playerCount } = usePlayerCount();
  const { data: statusCounts = {} } = usePlayersByStatus();
  const total = data?.total ?? 0;
  const weekly = data?.weekly ?? 0;
  const pipelineCount = (statusCounts.shortlist ?? 0) + (statusCounts.trial ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Przeglad kluczowych wskaznikow</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsWidget
          title="Zawodnicy"
          value={playerCount ?? 0}
          subtitle="Wszystkich w bazie"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsWidget
          title="Obserwacje"
          value={isLoading ? "..." : total}
          subtitle="Lacznie przeprowadzonych"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatsWidget
          title="Ostatni tydzien"
          value={isLoading ? "..." : weekly}
          subtitle="Nowych obserwacji"
          icon={<Eye className="h-4 w-4" />}
        />
        <StatsWidget
          title="W pipeline"
          value={pipelineCount}
          subtitle="Shortlist + Trial"
          icon={<Eye className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <PipelineSummary />
        </div>
        <Card>
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-base">Szybkie akcje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-6">
            <Button asChild className="w-full justify-start gap-2">
              <Link to="/observations/new">
                <ClipboardList className="h-4 w-4" />
                Dodaj nowa obserwacje
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/players">
                <Users className="h-4 w-4" />
                Przegladaj zawodnikow
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/pipeline">
                <Eye className="h-4 w-4" />
                Zarzadzaj pipeline
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
