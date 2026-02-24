import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSurveyCanSubmit, useSurveySubmit } from "@/features/survey/hooks/useSurvey";
import { SatisfactionForm } from "@/features/survey/components/SatisfactionForm";
import type { SatisfactionFormValues } from "@/features/survey/components/SatisfactionForm";
import { toast } from "@/hooks/use-toast";

export function SurveySatisfactionPage() {
  const [searchParams] = useSearchParams();
  const force = searchParams.get("force") === "true";
  const navigate = useNavigate();
  const { data: canSubmitData, isLoading: canSubmitLoading } = useSurveyCanSubmit();
  const submitMutation = useSurveySubmit();

  useEffect(() => {
    if (force || canSubmitLoading || !canSubmitData) return;
    if (!canSubmitData.can_submit) {
      const days = canSubmitData.days_until_next ?? 90;
      toast({
        title: "Dziękujemy!",
        description: `Ankietę można wypełnić ponownie za ${days} dni.`,
        variant: "default",
      });
      navigate("/", { replace: true });
    }
  }, [canSubmitData, canSubmitLoading, force, navigate]);

  const handleSubmit = async (values: SatisfactionFormValues) => {
    try {
      await submitMutation.mutateAsync(values);
      navigate("/survey/thank-you", { replace: true });
    } catch (e) {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać ankiety. Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  };

  if (canSubmitLoading && !force) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 text-center text-slate-500">
        Ładowanie…
      </div>
    );
  }

  if (!force && canSubmitData && !canSubmitData.can_submit) {
    return null;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Ankieta satysfakcji — ScoutPro</h1>
        <p className="mt-2 text-slate-600">
          Pomóż nam rozwijać aplikację! Twoja opinia zajmie tylko 2 minuty.
        </p>
      </div>
      <SatisfactionForm onSubmit={handleSubmit} isSubmitting={submitMutation.isPending} />
    </div>
  );
}
