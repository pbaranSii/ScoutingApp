import { PIPELINE_BOARD_COLUMNS, getStatusLeftBorderClass } from "@/features/pipeline/types";
import { canAccessPipeline } from "@/features/users/types";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { usePlayersByStatus } from "../hooks/useDashboard";

export function PipelineSummary() {
  const { data: profile } = useCurrentUserProfile();
  const { data = {}, isLoading } = usePlayersByStatus();

  if (!canAccessPipeline(profile?.business_role)) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {isLoading && (
        <p className="text-sm text-slate-500">Ładowanie...</p>
      )}
      {!isLoading &&
        PIPELINE_BOARD_COLUMNS.map((column) => (
          <div
            key={column.id}
            className={`min-w-0 rounded border-l-4 bg-white px-3 py-2 text-sm shadow-sm ${getStatusLeftBorderClass(column.id)}`}
          >
            <span className="text-xs text-slate-600">
              {column.shortLabel ?? column.label}
            </span>
            <span className="ml-1 font-semibold text-slate-900">
              {data[column.id] ?? 0}
            </span>
          </div>
        ))}
    </div>
  );
}
