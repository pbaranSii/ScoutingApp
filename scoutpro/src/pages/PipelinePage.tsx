import { useState } from "react";
import { PipelineBoard } from "@/features/pipeline/components/PipelineBoard";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";

export function PipelinePage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pipeline"
        subtitle="Przeciagnij karte zawodnika, aby zmienic status."
      />
      <Input
        placeholder="Szukaj po nazwisku, imieniu lub klubie"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <PipelineBoard search={search} />
    </div>
  );
}
