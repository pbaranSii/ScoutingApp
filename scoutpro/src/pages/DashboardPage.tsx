import { StatsWidget } from "@/features/dashboard/components/StatsWidget";
import { RecentObservations } from "@/features/dashboard/components/RecentObservations";
import { PipelineSummary } from "@/features/dashboard/components/PipelineSummary";
import { TopPlayers } from "@/features/dashboard/components/TopPlayers";
import { useObservationStats } from "@/features/dashboard/hooks/useDashboard";

export function DashboardPage() {
  const { data, isLoading } = useObservationStats();
  const total = data?.total ?? 0;
  const monthly = data?.monthly ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatsWidget
          title="Obserwacje (miesiac)"
          value={isLoading ? "..." : monthly}
        />
        <StatsWidget
          title="Obserwacje (razem)"
          value={isLoading ? "..." : total}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineSummary />
        </div>
        <TopPlayers />
      </div>
      <RecentObservations />
    </div>
  );
}
