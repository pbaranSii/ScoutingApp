import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { DICTIONARIES } from "@/features/dictionaries/config";
import { useDictionaryCounts } from "@/features/dictionaries/hooks/useDictionaries";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

export function DictionaryListPage() {
  const { data: counts, isLoading } = useDictionaryCounts();

  const getCount = (id: string) => {
    const item = counts?.find((c) => c.id === id);
    return item ? `${item.active} / ${item.total}` : "–";
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/settings" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót do ustawień
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Słowniki</h1>
        <p className="text-sm text-slate-600">
          Zarządzaj słownikami używanymi w formularzach rejestracji zawodników i obserwacji.
        </p>
      </div>
      {isLoading ? (
        <div className="text-sm text-slate-500">Ładowanie…</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DICTIONARIES.map((dict) => (
            <Link key={dict.id} to={`/settings/dictionaries/${dict.route}`}>
              <Card className="transition-colors hover:bg-slate-50">
                <CardContent className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2">
                      <BookOpen className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{dict.namePl}</p>
                      <p className="text-sm text-slate-500">{getCount(dict.id)} pozycji</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
