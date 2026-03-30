import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { OverviewTab } from "@/features/admin-stats/components/OverviewTab";
import { RozliczeniaTab } from "@/features/admin-stats/components/RozliczeniaTab";
import { UsersTab } from "@/features/admin-stats/components/UsersTab";
import { ActivityTab } from "@/features/admin-stats/components/ActivityTab";
import { TrendsTab } from "@/features/admin-stats/components/TrendsTab";

const TAB_KEYS = ["overview", "users", "activity", "trends", "rozliczenia"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const LS_TAB_KEY = "scoutpro:usage-statistics-tab";

export function UsageStatisticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabKey | null;
  const validTab = tabFromUrl && TAB_KEYS.includes(tabFromUrl) ? tabFromUrl : "overview";

  const activeTab = useMemo(() => validTab, [validTab]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TAB_KEY, activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  const setTab = (t: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", t);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/settings">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Wstecz
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Statystyki użytkowników</h1>
          <p className="text-sm text-slate-600">Monitoruj aktywność i wykorzystanie systemu</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Użytkownicy</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="rozliczenia">Rozliczenia</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityTab />
        </TabsContent>
        <TabsContent value="trends" className="mt-4">
          <TrendsTab />
        </TabsContent>
        <TabsContent value="rozliczenia" className="mt-4">
          <RozliczeniaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
