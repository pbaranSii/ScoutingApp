import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFormations, useSetFormationDefault, useCloneFormation } from "@/features/tactical/hooks/useFormations";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, LayoutGrid, Plus, Star, Wrench } from "lucide-react";

export function TacticalFormationsListPage() {
  const { data: formations = [], isLoading } = useFormations();
  const setDefault = useSetFormationDefault();
  const cloneFormation = useCloneFormation();

  const handleSetDefault = async (formationId: string) => {
    try {
      await setDefault.mutateAsync(formationId);
      toast({ title: "Ustawiono schemat domyślny" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  const handleClone = async (formationId: string) => {
    try {
      await cloneFormation.mutateAsync(formationId);
      toast({ title: "Sklonowano schemat" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Błąd";
      toast({ variant: "destructive", title: "Błąd", description: msg });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/settings" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót do ustawień
        </Link>
      </div>
      <PageHeader
        title="Schematy taktyczne"
        subtitle="Zarządzaj schematami (formacjami) i ustawieniem domyślnym. Schematy systemowe są tylko do odczytu — można je klonować."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/settings/tactical/positions">
                Słownik pozycji
              </Link>
            </Button>
            <Button asChild>
              <Link to="/settings/tactical/formations/new">
                <Plus className="mr-2 h-4 w-4" />
                Nowy schemat
              </Link>
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-slate-500">Ładowanie…</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {formations.map((f) => {
                const slotsCount = f.slots_count ?? 0;
                const isSystem = f.is_system === true;
                const isDefault = f.is_default === true;
                return (
                  <div
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-100 p-2">
                        <LayoutGrid className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{f.name}</span>
                          {isSystem && (
                            <span title="Schemat systemowy (tylko do odczytu)">
                              <Wrench className="h-4 w-4 text-slate-400" />
                            </span>
                          )}
                          {isDefault && (
                            <Badge className="rounded-full bg-amber-100 text-amber-800">Domyślny</Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          Kod: {f.code} · {slotsCount} slotów
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(f.id)}
                          disabled={setDefault.isPending}
                        >
                          <Star className="mr-1 h-4 w-4" />
                          Ustaw domyślny
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClone(f.id)}
                        disabled={cloneFormation.isPending}
                      >
                        <Copy className="mr-1 h-4 w-4" />
                        Klonuj
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={isSystem ? `/settings/tactical/formations/${f.id}` : `/settings/tactical/formations/${f.id}`}>
                          {isSystem ? "Podgląd" : "Edytuj"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {formations.length === 0 && !isLoading && (
            <p className="p-4 text-sm text-slate-500">Brak schematów. Utwórz nowy lub uruchom migrację z danymi systemowymi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
