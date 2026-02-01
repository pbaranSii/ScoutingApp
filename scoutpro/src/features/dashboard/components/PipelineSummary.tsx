import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_COLUMNS } from "@/features/pipeline/types";
import { usePlayersByStatus } from "../hooks/useDashboard";

export function PipelineSummary() {
  const { data = {}, isLoading } = usePlayersByStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {isLoading && <p className="text-sm text-slate-500">Ladowanie...</p>}
        {!isLoading &&
          PIPELINE_COLUMNS.map((column) => (
            <div key={column.id} className="rounded-md bg-slate-50 p-3">
              <div className="text-xs text-slate-500">{column.label}</div>
              <div className="text-lg font-semibold text-slate-900">
                {data[column.id] ?? 0}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
