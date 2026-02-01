import { ObservationWizard } from "@/features/observations/components/ObservationWizard";

export function NewObservationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Nowa obserwacja</h1>
      <ObservationWizard />
    </div>
  );
}
