import { useObservations } from "@/features/observations/hooks/useObservations";
import { ObservationList } from "@/features/observations/components/ObservationList";

export function ObservationsPage() {
  const { data = [], isLoading } = useObservations();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Obserwacje</h1>
      <ObservationList observations={data} isLoading={isLoading} />
    </div>
  );
}
