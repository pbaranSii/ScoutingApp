import { Link } from "react-router-dom";
import { StatsWidget } from "@/features/dashboard/components/StatsWidget";
import { PipelineSummary } from "@/features/dashboard/components/PipelineSummary";
import { RecentPlayers } from "@/features/dashboard/components/RecentPlayers";
import { RecentObservations } from "@/features/dashboard/components/RecentObservations";
import { MyTasksCard } from "@/features/dashboard/components/MyTasksCard";
import { RecentDemandsCard } from "@/features/dashboard/components/RecentDemandsCard";
import {
  useObservationStats,
  usePlayerCount,
  usePlayersByStatus,
} from "@/features/dashboard/hooks/useDashboard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canViewAnalytics } from "@/features/users/types";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { BarChart3, ClipboardList, Eye, Plus, Users } from "lucide-react";

export function DashboardPage() {
  const { data: profile } = useCurrentUserProfile();
  const { data, isLoading } = useObservationStats();
  const { data: playerCount } = usePlayerCount();
  const { data: statusCounts = {} } = usePlayersByStatus();
  const total = data?.total ?? 0;
  const weekly = data?.weekly ?? 0;
  const pipelineCount = (statusCounts.in_contact ?? 0) + (statusCounts.evaluation ?? 0);
  const showAnalytics = canViewAnalytics(profile?.business_role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Przegląd kluczowych wskaźników"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" />
                Nowa obserwacja
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/observations/match/new">Obserwacja meczowa</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/observations/new">Obserwacja indywidualna</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

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
          subtitle="Kontakt + Weryfikacja"
          icon={<Eye className="h-4 w-4" />}
        />
      </div>

      <PipelineSummary />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <RecentPlayers />
          <RecentObservations />
        </div>
        <div className="space-y-4">
          <MyTasksCard />
          <RecentDemandsCard />
          {showAnalytics && (
            <Link
              to="/analytics/recruitment-pipeline"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <BarChart3 className="h-4 w-4 text-slate-500" />
              Recruitment Analytics
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
