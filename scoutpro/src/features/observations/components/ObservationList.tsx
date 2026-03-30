import type { Observation } from "../types";
import { ObservationCard } from "./ObservationCard";
import { useQuery } from "@tanstack/react-query";
import { fetchObservationMatchCounts } from "../api/observationMatches.api";

type ObservationListProps = {
  observations: Observation[];
  isLoading: boolean;
};

export function ObservationList({ observations, isLoading }: ObservationListProps) {
  const observationIds = observations.map((o) => o.id);
  const stableKey = [...observationIds].sort().join(",");
  const { data: matchCounts = {} } = useQuery({
    queryKey: ["observation-match-counts", stableKey],
    queryFn: () => fetchObservationMatchCounts(observationIds),
    enabled: observationIds.length > 0,
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ładowanie...</p>;
  }

  if (!observations.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
        Brak obserwacji. Dodaj pierwsza obserwacje.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {observations.map((observation) => (
        <ObservationCard
          key={observation.id}
          observation={observation}
          matchCount={matchCounts[observation.id] ?? null}
        />
      ))}
    </div>
  );
}
