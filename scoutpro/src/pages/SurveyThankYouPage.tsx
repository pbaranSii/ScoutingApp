import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SurveyThankYouPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Dziękujemy za opinię!</h1>
        <p className="mt-2 text-slate-600">
          Twoja odpowiedź została zapisana i pomoże nam rozwijać ScoutPro zgodnie z Twoimi potrzebami.
        </p>
        <div className="mt-6 text-left text-sm text-slate-600">
          <p className="font-medium text-slate-800">Co dalej?</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Będziemy analizować feedback użytkowników</li>
            <li>Najczęstsze sugestie zostaną wdrożone w kolejnych wersjach</li>
            <li>Otrzymasz informacje o nowych funkcjach</li>
          </ul>
        </div>
        <Link to="/dashboard" className="mt-8 block">
          <Button>Wróć do aplikacji</Button>
        </Link>
      </div>
    </div>
  );
}
