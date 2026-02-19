import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft, Trash2, Share2 } from "lucide-react";
import { useFavoriteList, useUpdateFavoriteList, useListMembers, useRemovePlayerFromList } from "@/features/favorites/hooks";
import { FormationSelector } from "@/features/favorites/components/FormationSelector";
import { FavoritePitchVisualization } from "@/features/favorites/components/FavoritePitchVisualization";
import { ShareListDialog } from "@/features/favorites/components/ShareListDialog";
import { ExportButtons } from "@/features/favorites/components/ExportButtons";
import { groupPlayersByFormationSlots } from "@/features/favorites/utils/formations";
import type { FormationCode } from "@/features/favorites/types";
import { mapLegacyPosition } from "@/features/players/positions";
import { ALL_PIPELINE_STATUSES, getStatusBadgeClass } from "@/features/pipeline/types";
import { toast } from "@/hooks/use-toast";

export function FavoriteListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedPositionCode, setSelectedPositionCode] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: list, isLoading: listLoading } = useFavoriteList(id ?? null);
  const { data: members = [], isLoading: membersLoading } = useListMembers(id ?? null);
  const updateList = useUpdateFavoriteList();
  const removeMember = useRemovePlayerFromList(id ?? null);

  const formation = (list?.formation as FormationCode) || "4-4-2";
  const { slots, benchPlayerIds } = useMemo(
    () => groupPlayersByFormationSlots(formation, members),
    [formation, members]
  );
  const memberNames = useMemo(() => {
    const m: Record<string, string> = {};
    for (const mem of members) {
      const p = mem.player;
      if (p) m[mem.player_id] = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "?";
    }
    return m;
  }, [members]);

  const averageRating = useMemo(() => {
    const withRating = members.filter((m) => m.player && typeof (m.player as { overall_rating?: number }).overall_rating === "number");
    if (withRating.length === 0) return null;
    const sum = withRating.reduce((a, m) => a + Number((m.player as { overall_rating?: number }).overall_rating), 0);
    return Math.round((sum / withRating.length) * 10) / 10;
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!selectedPositionCode) return members;
    return members.filter((m) => {
      const pos = m.player?.primary_position;
      const code = mapLegacyPosition(pos ?? "").toUpperCase();
      const norm = code || (pos ?? "").toUpperCase();
      return norm === selectedPositionCode || (selectedPositionCode === "ST" && (norm === "LS" || norm === "RS"));
    });
  }, [members, selectedPositionCode]);

  const handleFormationChange = (value: FormationCode) => {
    if (!id) return;
    updateList.mutate(
      { id, input: { formation: value } },
      {
        onSuccess: () => toast({ title: "Formacja zaktualizowana" }),
        onError: (e) => toast({ variant: "destructive", title: "Błąd", description: e.message }),
      }
    );
  };

  const handleRemove = async (playerId: string) => {
    try {
      await removeMember.mutateAsync(playerId);
      toast({ title: "Zawodnik usunięty z listy" });
    } catch (e) {
      toast({ variant: "destructive", title: "Błąd", description: e instanceof Error ? e.message : "Nie udało się usunąć." });
    }
  };

  if (listLoading || !id) {
    return <p className="text-sm text-slate-500">Ładowanie…</p>;
  }
  if (!list) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">Nie znaleziono listy.</p>
        <Button asChild variant="outline">
          <Link to="/favorites">Wróć do list</Link>
        </Button>
      </div>
    );
  }

  const playersCount = (list as { players_count?: number }).players_count ?? members.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link to="/favorites" className="inline-flex items-center gap-2 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Powrót do list
        </Link>
      </div>

      <PageHeader
        title={list.name}
        subtitle={
          list.description
            ? list.description
            : `${playersCount} zawodników${averageRating != null ? ` · Śr. ocena: ${averageRating}/10` : ""}`
        }
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <FormationSelector value={formation} onChange={handleFormationChange} disabled={updateList.isPending} />
            <ExportButtons list={list} members={members} slots={slots} averageRating={averageRating} />
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="gap-1">
              <Share2 className="h-4 w-4" />
              Udostępnij
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Zawodnicy ({filteredMembers.length})</h3>
          {membersLoading ? (
            <p className="text-sm text-slate-500">Ładowanie…</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-sm text-slate-500">Brak zawodników na liście.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Zawodnik</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Pozycja</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Wiek</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Klub</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Ocena</th>
                    <th className="px-2 py-1.5 text-left font-medium text-slate-700">Status</th>
                    <th className="px-2 py-1.5 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMembers.map((mem) => {
                    const p = mem.player;
                    const posCode = p?.primary_position ? mapLegacyPosition(p.primary_position) : "—";
                    const statusKey = (p?.pipeline_status ?? "unassigned") as string;
                    const statusLabel = ALL_PIPELINE_STATUSES.find((s) => s.id === statusKey)?.label ?? "—";
                    const statusClass = getStatusBadgeClass(statusKey);
                    const rating = (p as { overall_rating?: number })?.overall_rating;
                    const birthYear = p?.birth_year;
                    const age = birthYear ? new Date().getFullYear() - birthYear : "—";
                    return (
                      <tr
                        key={mem.id}
                        className={
                          selectedPositionCode
                            ? slots.some((s) => s.playerIds.includes(mem.player_id))
                              ? "bg-amber-50"
                              : ""
                            : ""
                        }
                      >
                        <td className="px-2 py-1.5 font-medium">
                          {p?.first_name} {p?.last_name}
                        </td>
                        <td className="px-2 py-1.5 text-slate-600">{posCode}</td>
                        <td className="px-2 py-1.5 text-slate-600">{age}</td>
                        <td className="px-2 py-1.5 text-slate-600">{(p?.club as { name?: string })?.name ?? "—"}</td>
                        <td className="px-2 py-1.5">{rating != null ? rating : "—"}</td>
                        <td className="px-2 py-1.5">
                          <span className={`rounded px-1.5 py-0.5 text-xs ${statusClass}`}>{statusLabel}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600"
                            onClick={() => handleRemove(mem.player_id)}
                            disabled={removeMember.isPending}
                            title="Usuń z listy"
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
        </div>

        <div className="hidden lg:block lg:sticky lg:top-4">
          <h3 className="font-semibold text-slate-900 mb-2">Boisko</h3>
          <FavoritePitchVisualization
            formation={formation}
            slots={slots}
            benchPlayerIds={benchPlayerIds}
            memberNames={memberNames}
            selectedPositionCode={selectedPositionCode}
            onSelectPosition={setSelectedPositionCode}
          />
        </div>
      </div>

      <div className="flex lg:hidden gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedPositionCode === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPositionCode(null)}
        >
          Wszystkie
        </Button>
        {slots.map((s) => (
          <Button
            key={s.positionCode}
            variant={selectedPositionCode === s.positionCode ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPositionCode(selectedPositionCode === s.positionCode ? null : s.positionCode)}
          >
            {s.positionCode}({s.count})
          </Button>
        ))}
      </div>

      <ShareListDialog
        open={shareOpen}
        listId={id}
        listName={list.name}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
