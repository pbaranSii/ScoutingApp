import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskFormData, TaskStatus, TaskType } from "../types";
import {
  TASK_TYPE_LABELS,
  TASK_TYPE_DESCRIPTIONS,
  TASK_STATUS_LABELS,
} from "../types";
import { TaskPlayerPickerModal } from "./TaskPlayerPickerModal";
import type { PlayerSearchItem } from "@/features/players/api/players.api";
import type { UserProfile } from "@/features/users/types";
import {
  ArrowLeft,
  Check,
  CheckSquare,
  Calendar,
  ClipboardList,
  Loader2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TYPE_BOX_CONFIG: Record<
  TaskType,
  { icon: LucideIcon; iconBg: string }
> = {
  task: { icon: CheckSquare, iconBg: "bg-blue-100" },
  invitation: { icon: Calendar, iconBg: "bg-purple-100" },
  observation: { icon: ClipboardList, iconBg: "bg-green-100" },
};

const EMPTY_FORM: TaskFormData = {
  type: "",
  description: "",
  assigned_to: "",
  deadline: "",
  status: "pending",
  location: "",
  meeting_date: "",
  inviter_info: "",
  observation_location: "",
  observation_date: "",
  observation_source: "",
  selected_player_ids: [],
};

function taskFormFromTask(
  task: Partial<TaskFormData> & { player_ids?: string[] }
): TaskFormData {
  return {
    type: (task.type as TaskType) || "",
    description: task.description ?? "",
    assigned_to: task.assigned_to ?? "",
    deadline: task.deadline ?? "",
    status: (task.status ?? "pending") as TaskStatus,
    location: task.location ?? "",
    meeting_date: task.meeting_date ?? "",
    inviter_info: task.inviter_info ?? "",
    observation_location: task.observation_location ?? "",
    observation_date: task.observation_date ?? "",
    observation_source: task.observation_source ?? "",
    selected_player_ids: task.player_ids ?? [],
  };
}

export type TaskFormErrors = Partial<Record<keyof TaskFormData, string>>;

function validateForm(data: TaskFormData): TaskFormErrors {
  const errors: TaskFormErrors = {};
  if (!data.type) errors.type = "Wybierz typ elementu";
  if (!(data.description ?? "").trim()) errors.description = "Opis jest wymagany";
  if (data.type !== "invitation" && !data.deadline)
    errors.deadline = "Deadline jest wymagany";

  if (data.type === "observation") {
    if (!(data.observation_location ?? "").trim())
      errors.observation_location = "Miejsce obserwacji jest wymagane";
    if (!data.observation_date)
      errors.observation_date = "Data obserwacji jest wymagana";
  }

  return errors;
}

type TaskFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<TaskFormData> & { player_ids?: string[] };
  users: UserProfile[];
  players: PlayerSearchItem[];
  playersLoading?: boolean;
  onSubmit: (data: TaskFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
};

export function TaskForm({
  mode,
  initialData,
  users,
  players,
  onSubmit,
  isSubmitting,
  onCancel,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>(
    initialData ? taskFormFromTask(initialData) : { ...EMPTY_FORM }
  );
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validateForm(formData);
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      onSubmit(formData);
    },
    [formData, onSubmit]
  );

  const isObservation = formData.type === "observation";
  const isInvitation = formData.type === "invitation";
  const selectedPlayers = useMemo(
    () =>
      players.filter((p) =>
        (formData.selected_player_ids ?? []).includes(p.id)
      ),
    [players, formData.selected_player_ids]
  );
  const removeSelectedPlayer = useCallback((playerId: string) => {
    setFormData((prev) => ({
      ...prev,
      selected_player_ids: (prev.selected_player_ids ?? []).filter(
        (id) => id !== playerId
      ),
    }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Typ elementu <span className="text-red-500">*</span>
        </label>
        {mode === "create" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {(["task", "invitation", "observation"] as const).map((t) => {
              const selected = formData.type === t;
              const { icon: Icon, iconBg } = TYPE_BOX_CONFIG[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: t }))
                  }
                  className={`flex flex-col items-stretch rounded-lg border-2 p-4 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mb-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} text-slate-700`}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="font-medium text-slate-900">
                    {TASK_TYPE_LABELS[t]}
                  </div>
                  <div className="mt-1 flex-1 text-sm text-slate-600">
                    {TASK_TYPE_DESCRIPTIONS[t]}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className="flex flex-col items-stretch rounded-lg border-2 border-slate-200 bg-slate-50 p-4 opacity-90"
            aria-readonly
          >
            {formData.type && (() => {
              const cfg = TYPE_BOX_CONFIG[formData.type as TaskType];
              const Icon = cfg.icon;
              return (
                <span
                  className={`mb-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg} text-slate-700`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
              );
            })()}
            <div className="font-medium text-slate-900">
              {formData.type ? TASK_TYPE_LABELS[formData.type as TaskType] : "—"}
            </div>
            {formData.type && (
              <div className="mt-1 flex-1 text-sm text-slate-600">
                {TASK_TYPE_DESCRIPTIONS[formData.type as TaskType]}
              </div>
            )}
          </div>
        )}
        {errors.type && (
          <p className="text-sm text-red-600">{errors.type}</p>
        )}
      </div>

      {mode === "edit" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Status
          </label>
          <Select
            value={(formData.status ?? "pending") as TaskStatus}
            onValueChange={(v) =>
              setFormData((prev) => ({ ...prev, status: v as TaskStatus }))
            }
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Section 2: Basic */}
      {formData.type && (
        <>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">
              {isObservation ? "Treść" : "Opis"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder={
                isObservation
                  ? "Opisz planowaną obserwację..."
                  : isInvitation
                    ? "Opisz zaproszenie..."
                    : "Opisz zadanie..."
              }
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
            Przypisz do użytkownika
          </label>
            <Select
              value={formData.assigned_to || "none"}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  assigned_to: v === "none" ? "" : v,
                }))
              }
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Wybierz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name?.trim() || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="deadline" className="text-sm font-medium text-slate-700">
            Deadline
            {formData.type !== "invitation" && (
              <> <span className="text-red-500">*</span></>
            )}
          </label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deadline: e.target.value }))
              }
            />
            {errors.deadline && (
              <p className="text-sm text-red-600">{errors.deadline}</p>
            )}
          </div>
        </>
      )}

      {/* Section 3a: Invitation */}
      {isInvitation && (
        <>
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium text-slate-700">
              Lokalizacja
            </label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="np. Akademia Legia Warszawa, sala konferencyjna"
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="meeting_date" className="text-sm font-medium text-slate-700">
              Data i godzina spotkania
            </label>
            <Input
              id="meeting_date"
              type="datetime-local"
              value={formData.meeting_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, meeting_date: e.target.value }))
              }
            />
            {errors.meeting_date && (
              <p className="text-sm text-red-600">{errors.meeting_date}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="inviter_info" className="text-sm font-medium text-slate-700">
              Informacje o osobie zapraszającej
            </label>
            <Input
              id="inviter_info"
              value={formData.inviter_info}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, inviter_info: e.target.value }))
              }
              placeholder="np. Anna Kowalska (matka zawodnika)"
            />
          </div>
        </>
      )}

      {/* Section 3b: Observation */}
      {isObservation && (
        <>
          <div className="space-y-2">
            <label htmlFor="observation_location" className="text-sm font-medium text-slate-700">
              Miejsce obserwacji <span className="text-red-500">*</span>
            </label>
            <Input
              id="observation_location"
              value={formData.observation_location}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observation_location: e.target.value,
                }))
              }
              placeholder="np. Stadion Legii Warszawa"
            />
            {errors.observation_location && (
              <p className="text-sm text-red-600">{errors.observation_location}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="observation_date" className="text-sm font-medium text-slate-700">
              Data i godzina obserwacji <span className="text-red-500">*</span>
            </label>
            <Input
              id="observation_date"
              type="datetime-local"
              value={formData.observation_date}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observation_date: e.target.value,
                }))
              }
            />
            {errors.observation_date && (
              <p className="text-sm text-red-600">{errors.observation_date}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="observation_source" className="text-sm font-medium text-slate-700">
              Źródło zaproszenia / Osoba zapraszająca
            </label>
            <Input
              id="observation_source"
              value={formData.observation_source}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observation_source: e.target.value,
                }))
              }
              placeholder="np. Trener klubu, Dyrektor sportowy"
            />
          </div>
        </>
      )}

      {/* Section 4: Players (observation only) – optional, modal */}
      {isObservation && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Wybór zawodników
            {(formData.selected_player_ids?.length ?? 0) > 0 && (
              <> ({formData.selected_player_ids?.length})</>
            )}
          </label>
          <Button
            type="button"
            variant="outline"
            className="w-full max-w-xs gap-2"
            onClick={() => setPlayerPickerOpen(true)}
          >
            <Users className="h-4 w-4" />
            Wybierz zawodników
          </Button>
          {selectedPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedPlayers.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                >
                  {p.first_name} {p.last_name}
                  <button
                    type="button"
                    className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                    onClick={() => removeSelectedPlayer(p.id)}
                    aria-label={`Usuń ${p.first_name} ${p.last_name}`}
                  >
                    ×
                  </button>
                  </span>
                ))}
            </div>
          )}
          <TaskPlayerPickerModal
            open={playerPickerOpen}
            onClose={() => setPlayerPickerOpen(false)}
            selectedIds={formData.selected_player_ids ?? []}
            onChange={(ids) =>
              setFormData((prev) => ({ ...prev, selected_player_ids: ids }))
            }
            players={players}
          />
        </div>
      )}

      <div className="flex justify-between border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anuluj
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : mode === "create" ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Dodaj
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Zapisz zmiany
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
