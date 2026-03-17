import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Share2 } from "lucide-react";
import { useFavoriteList, useUpdateFavoriteList, useListMembers, useRemovePlayerFromList } from "@/features/favorites/hooks";
import { AddPlayerToListDialog } from "@/features/favorites/components/AddPlayerToListDialog";
import { FormationSelector } from "@/features/favorites/components/FormationSelector";
import { FavoritePitchVisualization } from "@/features/favorites/components/FavoritePitchVisualization";
import { ShareListDialog } from "@/features/favorites/components/ShareListDialog";
import { ExportButtons } from "@/features/favorites/components/ExportButtons";
import {
  groupPlayersByFormationSlots,
  groupPlayersByFormationSlotsFromDb,
  applySlotAssignments,
  getFormationSlots,
} from "@/features/favorites/utils/formations";
import type { FormationCode } from "@/features/favorites/types";
import { useFormationById, useDefaultFormation } from "@/features/tactical/hooks/useFormations";
import { mapLegacyPosition } from "@/features/players/positions";
import { ALL_PIPELINE_STATUSES, getStatusBadgeClass } from "@/features/pipeline/types";
import { toast } from "@/hooks/use-toast";

export function FavoriteListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedPositionCode, setSelectedPositionCode] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);

  const { data: list, isLoading: listLoading } = useFavoriteList(id ?? null);
  const { data: members = [], isLoading: membersLoading } = useListMembers(id ?? null);
  const { data: defaultFormation } = useDefaultFormation();
  const effectiveFormationId = list?.formation_id ?? defaultFormation?.id ?? null;
  const { data: formationWithSlots } = useFormationById(effectiveFormationId);
  const updateList = useUpdateFavoriteList();
  const removeMember = useRemovePlayerFromList(id ?? null);

  const formation = (list?.formation as FormationCode) || "4-4-2";
  const memberIds = useMemo(() => members.map((m) => m.player_id), [members]);
  const { slots, benchPlayerIds, slotsWithCoords, filterSlots, slotKeys } = useMemo(() => {
    const baseFormation = formation as FormationCode;
    if (effectiveFormationId && formationWithSlots?.tactical_slots?.length) {
      const out = groupPlayersByFormationSlotsFromDb(formationWithSlots, members);
      const keys = out.slots.map((_, i) => `f_${effectiveFormationId}_${i}`);
      const applied = applySlotAssignments(
        out.slots,
        keys,
        list?.slot_assignments ?? null,
        memberIds
      );
      const byCode = new Map<string, { positionCode: string; count: number; playerIds: string[] }>();
      for (const s of applied.slots) {
        const cur = byCode.get(s.positionCode);
        if (cur) {
          cur.count += s.count;
          cur.playerIds.push(...s.playerIds);
        } else byCode.set(s.positionCode, { positionCode: s.positionCode, count: s.count, playerIds: [...s.playerIds] });
      }
      const filterSlots = Array.from(byCode.values()).map((s) => ({
        positionCode: s.positionCode,
        label: s.positionCode,
        count: s.count,
        playerIds: s.playerIds,
      }));
      return {
        slots: applied.slots,
        benchPlayerIds: applied.benchPlayerIds,
        slotsWithCoords: applied.slots,
        filterSlots,
        slotKeys: keys,
      };
    }
    const out = groupPlayersByFormationSlots(baseFormation, members);
    const formationSlots = getFormationSlots(baseFormation);
    const seen = new Set<string>();
    const orderedCodes: string[] = [];
    for (const s of formationSlots) {
      if (!seen.has(s.positionCode)) {
        seen.add(s.positionCode);
        orderedCodes.push(s.positionCode);
      }
    }
    const keys = orderedCodes.map((_, i) => `l_${baseFormation}_${i}`);
    const applied = applySlotAssignments(out.slots, keys, list?.slot_assignments ?? null, memberIds);
    return {
      slots: applied.slots,
      benchPlayerIds: applied.benchPlayerIds,
      slotsWithCoords: undefined,
      filterSlots: applied.slots,
      slotKeys: keys,
    };
  }, [effectiveFormationId, formationWithSlots, formation, members, memberIds, list?.slot_assignments]);

  const playerAssignedPositions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const slot of slots) {
      for (const pid of slot.playerIds ?? []) {
        if (!map[pid]) map[pid] = [];
        if (!map[pid].includes(slot.positionCode)) {
          map[pid].push(slot.positionCode);
        }
      }
    }
    return map;
  }, [slots]);
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

  const selectedAssignedPlayerIds = useMemo(() => {
    if (!selectedPositionCode) return null;
    const ids = new Set<string>();
    for (const s of slots) {
      if (s.positionCode === selectedPositionCode) {
        for (const pid of s.playerIds ?? []) ids.add(pid);
      }
    }
    return ids;
  }, [selectedPositionCode, slots]);

  const filteredMembers = useMemo(() => {
    if (!selectedPositionCode) return members;
    if (!selectedAssignedPlayerIds) return [];
    return members.filter((m) => selectedAssignedPlayerIds.has(m.player_id));
  }, [members, selectedPositionCode, selectedAssignedPlayerIds]);

  const handleFormationChange = (value: { formation_id: string | null; formation: string }) => {
    if (!id) return;
    updateList.mutate(
      { id, input: { formation_id: value.formation_id, formation: value.formation } },
      {
        onSuccess: () => toast({ title: "Schemat zaktualizowany" }),
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

  const handleAssignSlot = (slotKey: string, playerIds: string[]) => {
    if (!id || !list) return;
    const current = (list.slot_assignments ?? {}) as Record<string, unknown>;
    const next: Record<string, string[]> = {};

    const toArray = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value.filter((v): v is string => typeof v === "string");
      }
      if (typeof value === "string") {
        return [value];
      }
      return [];
    };

    // Usuń wybranych zawodników ze wszystkich slotów (reguła: zawodnik może być w jednym slocie).
    for (const [key, rawIds] of Object.entries(current)) {
      const ids = toArray(rawIds);
      if (key === slotKey) continue;
      const filtered = ids.filter((idValue) => !playerIds.includes(idValue));
      if (filtered.length > 0) {
        next[key] = filtered;
      }
    }

    if (playerIds.length > 0) {
      next[slotKey] = [...playerIds];
    }
    updateList.mutate(
      { id, input: { slot_assignments: next } },
      {
        onSuccess: () => toast({ title: "Ustawienie zapisane" }),
        onError: (e) => toast({ variant: "destructive", title: "Błąd", description: e.message }),
      }
    );
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
  const subtitleText = list.description
    ? list.description
    : `${playersCount} zawodników${averageRating != null ? ` · Śr. ocena: ${averageRating}/10` : ""}`;

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/favorites"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót do list
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">{list.name}</h1>
          {subtitleText && <p className="text-sm text-slate-600 mt-0.5">{subtitleText}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FormationSelector
            value={{
              formation_id: list.formation_id ?? null,
              formation: list.formation || "4-4-2",
            }}
            onChange={handleFormationChange}
            disabled={updateList.isPending}
          />
          <ExportButtons list={list} members={members} slots={slots} averageRating={averageRating} />
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="gap-1">
            <Share2 className="h-4 w-4" />
            Udostępnij
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900">Zawodnicy ({filteredMembers.length})</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAddPlayerOpen(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                Dodaj zawodnika
              </Button>
              {selectedPositionCode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPositionCode(null)}
                >
                  Usuń filtr
                </Button>
              )}
            </div>
          </div>
          {membersLoading ? (
            <p className="text-sm text-slate-500">Ładowanie…</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-sm text-slate-500">Brak zawodników na liście.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredMembers.map((mem) => {
                const p = mem.player;
                const posCode = p?.primary_position ? mapLegacyPosition(p.primary_position) : "—";
                const rating = (p as { overall_rating?: number })?.overall_rating;
                const birthYear = p?.birth_year;
                const age = birthYear ? new Date().getFullYear() - birthYear : "—";
                const clubName = (p?.club as { name?: string })?.name ?? "—";
                const assignedPos = playerAssignedPositions[mem.player_id] ?? [];
                const assignedLabel =
                  assignedPos.length > 0 ? assignedPos.join(", ") : "Brak przypisania na schemacie";

                const isHighlighted =
                  !selectedPositionCode ||
                  (playerAssignedPositions[mem.player_id]?.includes(selectedPositionCode) ?? false);

                return (
                  <div
                    key={mem.id}
                    className={`rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm ${
                      isHighlighted ? "" : "opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/players/${mem.player_id}`}
                          className="font-semibold text-slate-900 hover:underline block truncate"
                          title="Przejdź do szczegółów zawodnika"
                        >
                          {p?.first_name} {p?.last_name}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Pozycja: {posCode} · Wiek: {age}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">Klub: {clubName}</p>
                        <button
                          type="button"
                          className="mt-1 text-xs text-left text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
                          onClick={() => {
                            if (!assignedPos.length) return;
                            // wybierz pierwszą przypisaną pozycję jako aktywny filtr, by użytkownik mógł łatwo zmienić slot
                            setSelectedPositionCode(assignedPos[0]);
                          }}
                        >
                          Pozycja na schemacie:{" "}
                          <span className="font-medium">{assignedLabel}</span>
                        </button>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-semibold text-slate-900">
                          {rating != null ? `${rating}/10` : "—"}
                        </span>
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:block lg:sticky lg:top-4">
          <FavoritePitchVisualization
            formation={formation}
            slots={slots}
            slotsWithCoords={slotsWithCoords}
            slotKeys={slotKeys}
            benchPlayerIds={benchPlayerIds}
            memberNames={memberNames}
            allMemberIds={memberIds}
            selectedPositionCode={selectedPositionCode}
            onSelectPosition={setSelectedPositionCode}
            onAssignSlot={handleAssignSlot}
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
        {filterSlots.map((s) => (
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
      <AddPlayerToListDialog
        open={addPlayerOpen}
        onClose={() => setAddPlayerOpen(false)}
        listId={id ?? null}
        existingPlayerIds={members.map((m) => m.player_id)}
      />
    </div>
  );
}
