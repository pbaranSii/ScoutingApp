import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  usePlayerDemand,
  useDemandCandidates,
  useUpdatePlayerDemand,
  useRemoveCandidate,
} from "@/features/demands/hooks";
import { DEMAND_PRIORITY_LABELS, DEMAND_STATUS_LABELS } from "@/features/demands/types";
import { formatPosition } from "@/features/players/positions";
import { DemandSuggestionsTab } from "@/features/demands/components/DemandSuggestionsTab";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DemandStatus } from "@/features/demands/types";

const CAN_MANAGE_ROLES = ["director", "coach", "admin"] as const;

export function DemandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const { data: demand, isLoading: demandLoading } = usePlayerDemand(id ?? null);
  const { data: candidates = [], isLoading: candidatesLoading } = useDemandCandidates(id ?? null);
  const updateDemand = useUpdatePlayerDemand();
  const removeCandidate = useRemoveCandidate(id ?? null);
  const { data: profile } = useCurrentUserProfile();

  const canManage = useMemo(
    () =>
      profile?.business_role &&
      CAN_MANAGE_ROLES.includes(profile.business_role as (typeof CAN_MANAGE_ROLES)[number]),
    [profile?.business_role]
  );

  const handleStatusChange = async (newStatus: DemandStatus) => {
    if (!id) return;
    try {
      await updateDemand.mutateAsync({
        id,
        input: { status: newStatus },
      });
      toast({ title: "Status zaktualizowany" });
      setStatusSelectOpen(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się zaktualizować statusu.",
      });
    }
  };

  const handleRemoveCandidate = async (playerId: string) => {
    try {
      await removeCandidate.mutateAsync(playerId);
      toast({ title: "Kandydat usunięty z zapotrzebowania" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: e instanceof Error ? e.message : "Nie udało się usunąć.",
      });
    }
  };

  if (demandLoading || !id) {
    return <p className="text-sm text-slate-500">Ładowanie…</p>;
  }
  if (!demand) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">Nie znaleziono zapotrzebowania.</p>
        <Button asChild variant="outline">
          <Link to="/demands">Wróć do listy</Link>
        </Button>
      </div>
    );
  }

  const clubName = demand.club?.name ?? "—";
  const positionLabel = formatPosition(demand.position);
  const candidatesCount = demand.candidates_count ?? 0;
  const quantityNeeded = demand.quantity_needed ?? 1;
  const progress = `${candidatesCount}/${quantityNeeded}`;

  const priorityVariant =
    demand.priority === "critical" ? "destructive" : demand.priority === "high" ? "default" : "secondary";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/demands" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy
        </Link>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/demands/${id}/edit`} className="gap-1">
                <Pencil className="h-4 w-4" />
                Edytuj
              </Link>
            </Button>
            <Select
              value={demand.status}
              onValueChange={(v) => handleStatusChange(v as DemandStatus)}
              open={statusSelectOpen}
              onOpenChange={setStatusSelectOpen}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{DEMAND_STATUS_LABELS.open}</SelectItem>
                <SelectItem value="in_progress">{DEMAND_STATUS_LABELS.in_progress}</SelectItem>
                <SelectItem value="filled">{DEMAND_STATUS_LABELS.filled}</SelectItem>
                <SelectItem value="cancelled">{DEMAND_STATUS_LABELS.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <PageHeader
        title={`${positionLabel} · ${demand.season}`}
        subtitle={[
          clubName,
          `Kandydaci: ${progress}`,
          demand.age_min != null || demand.age_max != null
            ? `Wiek: ${[demand.age_min, demand.age_max].filter(Boolean).join("–")} lat`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={priorityVariant}>{DEMAND_PRIORITY_LABELS[demand.priority]}</Badge>
            <Badge variant="outline">{DEMAND_STATUS_LABELS[demand.status]}</Badge>
          </div>
        }
      />

      <Tabs defaultValue="candidates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="candidates">Kandydaci ({candidates.length})</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestie</TabsTrigger>
        </TabsList>
        <TabsContent value="candidates" className="space-y-3">
          <h3 className="font-semibold text-slate-900">Przypisani kandydaci</h3>
          {candidatesLoading ? (
            <p className="text-sm text-slate-500">Ładowanie…</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-slate-500">Brak przypisanych kandydatów. Użyj zakładki Sugestie lub przypisz zawodnika z listy zawodników.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Zawodnik</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Pozycja</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Wiek</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Klub</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Typ</th>
                    <th className="px-2 py-1.5 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {candidates.map((c) => {
                    const p = c.player;
                    const age = p?.birth_year ? new Date().getFullYear() - p.birth_year : "—";
                    return (
                      <tr key={c.id}>
                        <td className="px-2 py-1.5 font-medium">
                          <Link
                            to={`/players/${c.player_id}`}
                            className="text-primary hover:underline"
                          >
                            {p?.first_name} {p?.last_name}
                          </Link>
                        </td>
                        <td className="px-2 py-1.5 text-slate-600">{p?.primary_position ?? "—"}</td>
                        <td className="px-2 py-1.5 text-slate-600">{age}</td>
                        <td className="px-2 py-1.5 text-slate-600">
                          {(p?.club as { name?: string })?.name ?? "—"}
                        </td>
                        <td className="px-2 py-1.5 text-slate-600">
                          {c.assignment_type === "suggested" ? "Sugestia" : "Ręcznie"}
                        </td>
                        <td className="px-2 py-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600"
                            onClick={() => handleRemoveCandidate(c.player_id)}
                            disabled={removeCandidate.isPending}
                            title="Usuń z zapotrzebowania"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="suggestions" className="space-y-3">
          <DemandSuggestionsTab demandId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
