import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GripVertical, Plus, Trash2, Share2, ArrowUp, ArrowDown } from "lucide-react";
import { useFavoriteList, useUpdateFavoriteList, useListMembers, useRemovePlayerFromList } from "@/features/favorites/hooks";
import { AddPlayerToListDialog } from "@/features/favorites/components/AddPlayerToListDialog";
import { FormationSelector } from "@/features/favorites/components/FormationSelector";
import { FavoritePitchVisualization } from "@/features/favorites/components/FavoritePitchVisualization";
import { ShareListDialog } from "@/features/favorites/components/ShareListDialog";
import { ExportButtons } from "@/features/favorites/components/ExportButtons";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  groupPlayersByFormationSlots,
  groupPlayersByFormationSlotsFromDb,
  applySlotAssignments,
  getFormationSlots,
} from "@/features/favorites/utils/formations";
import type { FormationCode } from "@/features/favorites/types";
import { useFormationById, useDefaultFormation } from "@/features/tactical/hooks/useFormations";
import { mapLegacyPosition } from "@/features/players/positions";
import { toast } from "@/hooks/use-toast";

export function FavoriteListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedPositionCode, setSelectedPositionCode] = useState<string | null>(null);
  const [pendingAssignPlayerId, setPendingAssignPlayerId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [assignDialogTargetSlotKey, setAssignDialogTargetSlotKey] = useState<string | null>(null);

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
      // Wyczyść usuniętego zawodnika z zapisanych kolejek per pozycja (pos_<CODE>)
      if (id && list?.slot_assignments) {
        const current = (list.slot_assignments ?? {}) as Record<string, unknown>;
        const next: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(current)) {
          if (!k.startsWith("pos_")) continue;
          const arr = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
          const filtered = arr.filter((x) => x !== playerId);
          if (filtered.length > 0) next[k] = filtered;
        }
        // zachowaj pozostałe klucze (sloty boiska) bez zmian
        for (const [k, v] of Object.entries(current)) {
          if (k.startsWith("pos_")) continue;
          const arr = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : (typeof v === "string" ? [v] : []);
          if (arr.length > 0) next[k] = arr;
        }
        updateList.mutate({ id, input: { slot_assignments: next } });
      }
      toast({ title: "Zawodnik usunięty z listy" });
    } catch (e) {
      toast({ variant: "destructive", title: "Błąd", description: e instanceof Error ? e.message : "Nie udało się usunąć." });
    }
  };

  const positionOrderKey = selectedPositionCode ? `pos_${selectedPositionCode}` : null;
  const currentAssignments = ((list?.slot_assignments ?? {}) as Record<string, unknown>) ?? {};
  const positionOrderByCode = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(currentAssignments)) {
      if (!k.startsWith("pos_")) continue;
      const code = k.slice("pos_".length).trim();
      if (!code) continue;
      const arr = Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string")
        : typeof v === "string"
          ? [v]
          : [];
      if (arr.length > 0) out[code] = arr;
    }
    return out;
  }, [currentAssignments]);
  const savedOrderForPosition: string[] = useMemo(() => {
    if (!positionOrderKey) return [];
    const raw = currentAssignments[positionOrderKey];
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
    if (typeof raw === "string") return [raw];
    return [];
  }, [currentAssignments, positionOrderKey]);

  const orderedFilteredMembers = useMemo(() => {
    if (!selectedPositionCode) return filteredMembers;
    const order = savedOrderForPosition;
    if (order.length === 0) return filteredMembers;
    const byPlayerId = new Map(filteredMembers.map((m) => [m.player_id, m]));
    const seen = new Set<string>();
    const result: typeof filteredMembers = [];
    for (const pid of order) {
      const m = byPlayerId.get(pid);
      if (m) {
        result.push(m);
        seen.add(pid);
      }
    }
    for (const m of filteredMembers) {
      if (!seen.has(m.player_id)) result.push(m);
    }
    return result;
  }, [filteredMembers, savedOrderForPosition, selectedPositionCode]);

  const persistPositionOrder = (nextOrder: string[]) => {
    if (!id || !positionOrderKey) return;
    const current = (list?.slot_assignments ?? {}) as Record<string, unknown>;
    const next: Record<string, string[]> = {};
    // przenieś wszystkie istniejące klucze do spójnego formatu string[]
    for (const [k, v] of Object.entries(current)) {
      if (Array.isArray(v)) {
        const arr = v.filter((x): x is string => typeof x === "string");
        if (arr.length > 0) next[k] = arr;
      } else if (typeof v === "string") {
        next[k] = [v];
      }
    }
    next[positionOrderKey] = nextOrder;
    updateList.mutate(
      { id, input: { slot_assignments: next } },
      {
        onSuccess: () => toast({ title: "Kolejność zapisana" }),
        onError: (e) => toast({ variant: "destructive", title: "Błąd", description: e.message }),
      }
    );
  };

  const handleReorderUpDown = (playerId: string, dir: "up" | "down") => {
    if (!selectedPositionCode || !positionOrderKey) return;
    const ids = orderedFilteredMembers.map((m) => m.player_id);
    const idx = ids.indexOf(playerId);
    const nextIdx = dir === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || nextIdx < 0 || nextIdx >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(idx, 1);
    next.splice(nextIdx, 0, moved);
    persistPositionOrder(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!selectedPositionCode || !positionOrderKey) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedFilteredMembers.map((m) => m.player_id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    persistPositionOrder(next);
  };

  function SortablePlayerCard({
    mem,
    children,
  }: {
    mem: (typeof filteredMembers)[number];
    children: React.ReactNode;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: mem.player_id,
      disabled: !selectedPositionCode || orderedFilteredMembers.length <= 1,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div ref={setNodeRef} style={style} className={isDragging ? "opacity-70" : "opacity-100"}>
        <div className="flex items-start gap-2">
          {selectedPositionCode && orderedFilteredMembers.length > 1 && (
            <button
              type="button"
              className="mt-1 flex shrink-0 cursor-grab touch-none items-start text-slate-400 active:cursor-grabbing"
              aria-label="Przeciągnij, aby zmienić kolejność"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    );
  }

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
    // Nie dotykamy tu kluczy `pos_<CODE>` (to tylko kolejność listy), bo aktualizujemy je osobno.
    for (const [key, rawIds] of Object.entries(current)) {
      if (key.startsWith("pos_")) continue;
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

    // Zachowaj istniejące kolejności per pozycja (pos_<CODE>) i zaktualizuj je dla pozycji tego slotu,
    // aby lista zawodników dla pozycji miała identyczną kolejność jak w modalu slota.
    for (const [key, rawIds] of Object.entries(current)) {
      if (!key.startsWith("pos_")) continue;
      const ids = toArray(rawIds);
      if (ids.length > 0) next[key] = ids;
    }

    // slotKey -> positionCode (na podstawie indeksu w slotKeys)
    const slotIndex = slotKeys.findIndex((k) => k === slotKey);
    const positionCodeForSlot =
      slotIndex >= 0 ? String((slots as Array<{ positionCode?: string }>)[slotIndex]?.positionCode ?? "") : "";
    if (positionCodeForSlot) {
      const relatedSlotKeys = slotKeys.filter((_, i) => {
        const c = String((slots as Array<{ positionCode?: string }>)[i]?.positionCode ?? "");
        return c === positionCodeForSlot;
      });
      const combined: string[] = [];
      const seen = new Set<string>();
      for (const k of relatedSlotKeys) {
        const ids = next[k] ?? [];
        for (const pid of ids) {
          if (!seen.has(pid)) {
            seen.add(pid);
            combined.push(pid);
          }
        }
      }
      next[`pos_${positionCodeForSlot}`] = combined;
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
    : `${playersCount} zawodników`;

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
          <ExportButtons list={list} members={members} slots={slots} />
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
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedFilteredMembers.map((m) => m.player_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid w-full gap-3 grid-cols-1">
                  {orderedFilteredMembers.map((mem) => {
                const p = mem.player;
                const posCode = p?.primary_position ? mapLegacyPosition(p.primary_position) : "—";
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
                  <SortablePlayerCard key={mem.id} mem={mem}>
                    <div
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
                            // Wejście w tryb: wybierz slot na schemacie i przypisz tego zawodnika.
                            setPendingAssignPlayerId(mem.player_id);
                            toast({
                              title: "Wybierz slot na schemacie",
                              description: "Kliknij pozycję na boisku, aby przypisać zawodnika do slotu.",
                            });
                          }}
                        >
                          Pozycja na schemacie:{" "}
                          <span className="font-medium">{assignedLabel}</span>
                        </button>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {selectedPositionCode && orderedFilteredMembers.length > 1 && (
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleReorderUpDown(mem.player_id, "up")}
                              title="Przesuń w górę"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleReorderUpDown(mem.player_id, "down")}
                              title="Przesuń w dół"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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
                  </SortablePlayerCard>
                );
                  })}
                </div>
              </SortableContext>
            </DndContext>
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
            pendingAssignPlayerId={pendingAssignPlayerId}
            positionOrderByCode={positionOrderByCode}
            onAssignPendingToSlot={(slotKey, playerId) => {
              handleAssignSlot(slotKey, [playerId]);
              setPendingAssignPlayerId(null);
              toast({ title: "Przypisano zawodnika do slotu" });
            }}
            onRequestAddPlayerToSlot={(slotKey) => {
              setAssignDialogTargetSlotKey(slotKey);
              setAddPlayerOpen(true);
            }}
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
        onClose={() => {
          setAddPlayerOpen(false);
          setAssignDialogTargetSlotKey(null);
        }}
        listId={id ?? null}
        existingPlayerIds={members.map((m) => m.player_id)}
        onAdded={(playerId) => {
          if (assignDialogTargetSlotKey) {
            handleAssignSlot(assignDialogTargetSlotKey, [playerId]);
          }
        }}
      />
    </div>
  );
}
