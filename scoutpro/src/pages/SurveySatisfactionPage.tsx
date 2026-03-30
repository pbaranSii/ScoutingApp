import { useNavigate } from "react-router-dom";
import { useSurveySubmit } from "@/features/survey/hooks/useSurvey";
import { SatisfactionForm } from "@/features/survey/components/SatisfactionForm";
import type { SatisfactionFormValues } from "@/features/survey/components/SatisfactionForm";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export function SurveySatisfactionPage() {
  const navigate = useNavigate();
  const submitMutation = useSurveySubmit();

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

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Ankieta satysfakcji — ScoutPro</h1>
        <p className="mt-2 text-slate-600">
          Pomóż nam rozwijać aplikację! Twoja opinia zajmie tylko 2 minuty.
        </p>
      </div>
      <Card className="border-slate-200 bg-slate-50/50">
        <CardContent className="p-6">
          <SatisfactionForm onSubmit={handleSubmit} isSubmitting={submitMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
