import { useState } from "react";
import { PipelineBoard } from "@/features/pipeline/components/PipelineBoard";
import { Input } from "@/components/ui/input";

export function PipelinePage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Pipeline</h1>
        <p className="text-sm text-slate-600">
          Przeciagnij karte zawodnika, aby zmienic status.
        </p>
      </div>
      <Input
        placeholder="Szukaj po nazwisku, imieniu lub klubie"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <PipelineBoard search={search} />
    </div>
  );
}
