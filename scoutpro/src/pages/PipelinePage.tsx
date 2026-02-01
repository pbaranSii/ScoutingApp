import { PipelineBoard } from "@/features/pipeline/components/PipelineBoard";

export function PipelinePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Pipeline</h1>
        <p className="text-sm text-slate-600">
          Przeciagnij karte zawodnika, aby zmienic status.
        </p>
      </div>
      <PipelineBoard />
    </div>
  );
}
