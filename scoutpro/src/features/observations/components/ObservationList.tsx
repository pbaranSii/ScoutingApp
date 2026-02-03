import type { Observation } from "../types";
import { ObservationCard } from "./ObservationCard";

type ObservationListProps = {
  observations: Observation[];
  isLoading: boolean;
};

export function ObservationList({ observations, isLoading }: ObservationListProps) {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
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
        <ObservationCard key={observation.id} observation={observation} />
      ))}
    </div>
  );
}
