import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_BOARD_COLUMNS } from "@/features/pipeline/types";
import { usePlayersByStatus } from "../hooks/useDashboard";

const STATUS_COLORS: Record<string, string> = {
  observed: "bg-slate-400",
  shortlist: "bg-blue-500",
  trial: "bg-yellow-400",
  offer: "bg-orange-500",
  signed: "bg-green-500",
  rejected: "bg-red-400",
};

export function PipelineSummary() {
  const { data = {}, isLoading } = usePlayersByStatus();

  return (
    <Card>
      <CardHeader className="pb-3 px-6">
        <CardTitle className="text-base">Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 text-sm">
        {isLoading && <p className="text-sm text-slate-500">Ladowanie...</p>}
        {!isLoading &&
          PIPELINE_BOARD_COLUMNS.map((column) => (
            <div key={column.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[column.id]}`} />
                <span className="text-sm text-slate-700">{column.label}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {data[column.id] ?? 0}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
