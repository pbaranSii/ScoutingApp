import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { BEST_FEATURE_OPTIONS } from "../api/survey.api";

export type SatisfactionFormValues = {
  csat_rating: number;
  ces_rating: number;
  nps_score: number;
  best_feature: string;
  feedback_text: string;
};

const FEEDBACK_MAX = 500;

type SatisfactionFormProps = {
  onSubmit: (values: SatisfactionFormValues) => void;
  isSubmitting: boolean;
};

export function SatisfactionForm({ onSubmit, isSubmitting }: SatisfactionFormProps) {
  const [csat, setCsat] = useState(0);
  const [ces, setCes] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [bestFeature, setBestFeature] = useState("");
  const [otherFeature, setOtherFeature] = useState("");
  const [feedback, setFeedback] = useState("");

  const resolvedBestFeature = bestFeature === "Inne" ? otherFeature.trim() || "Inne" : bestFeature;
  const canSubmit = csat >= 1 && csat <= 5 && ces >= 1 && ces <= 5 && nps !== null && nps >= 0 && nps <= 10 && resolvedBestFeature.length > 0;
  const feedbackLen = feedback.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      csat_rating: csat,
      ces_rating: ces,
      nps_score: nps!,
      best_feature: resolvedBestFeature,
      feedback_text: feedback.slice(0, FEEDBACK_MAX),
    });
  };

  const totalQuestions = 5;
  const filled = [csat > 0, ces > 0, nps !== null, resolvedBestFeature.length > 0, true].filter(Boolean).length;
  const progressPct = (filled / totalQuestions) * 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Pytanie {filled} z {totalQuestions} — {Math.round(progressPct)}%
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          1. Jak oceniasz swoją ogólną satysfakcję z aplikacji ScoutPro?
        </Label>
        <StarRating value={csat} onChange={setCsat} />
        <p className="text-xs text-slate-500">1 = Bardzo niezadowolony · 5 = Bardzo zadowolony</p>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          2. Jak łatwo jest wykonywać codzienne zadania w aplikacji?
        </Label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              type="button"
              variant={ces === n ? "default" : "outline"}
              size="sm"
              onClick={() => setCes(n)}
            >
              {n}
            </Button>
          ))}
        </div>
        <p className="text-xs text-slate-500">1 = Bardzo trudno · 5 = Bardzo łatwo</p>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          3. Na ile prawdopodobne jest, że poleciłbyś ScoutPro innym klubom/akademiom?
        </Label>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <Button
              key={n}
              type="button"
              variant={nps === n ? "default" : "outline"}
              size="sm"
              onClick={() => setNps(n)}
            >
              {n}
            </Button>
          ))}
        </div>
        <p className="text-xs text-slate-500">0 = W ogóle nie · 10 = Bardzo prawdopodobne</p>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          4. Która funkcja aplikacji jest dla Ciebie najbardziej przydatna?
        </Label>
        <div className="space-y-2">
          {BEST_FEATURE_OPTIONS.map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="best_feature"
                checked={bestFeature === opt}
                onChange={() => setBestFeature(opt)}
                className="h-4 w-4"
              />
              <span>{opt}</span>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="best_feature"
              checked={bestFeature === "Inne"}
              onChange={() => setBestFeature("Inne")}
              className="h-4 w-4"
            />
            <span>Inne:</span>
            <input
              type="text"
              value={otherFeature}
              onChange={(e) => setOtherFeature(e.target.value)}
              placeholder="Wpisz..."
              className="ml-2 flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
              disabled={bestFeature !== "Inne"}
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">
          5. Co możemy poprawić? Jakie problemy napotkałeś? Czego Ci brakuje?
        </Label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value.slice(0, FEEDBACK_MAX))}
          placeholder="Wpisz swoje uwagi tutaj..."
          rows={5}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500">Pozostało {FEEDBACK_MAX - feedbackLen} znaków</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Uwaga: Twoja odpowiedź nie jest anonimowa. Administrator może zobaczyć Twoje imię i treść opinii w celu
        lepszego zrozumienia potrzeb użytkowników.
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full min-h-11"
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? "Wysyłanie…" : "Wyślij ankietę"}
      </Button>
    </form>
  );
}
