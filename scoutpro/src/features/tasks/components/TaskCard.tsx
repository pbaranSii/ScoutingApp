import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus, TaskType } from "../types";
import { TASK_TYPE_LABELS, TASK_STATUS_LABELS } from "../types";
import { format, parseISO, isPast } from "date-fns";
import { pl } from "date-fns/locale";
import { Link } from "react-router-dom";
import { CheckSquare, Calendar, ClipboardList, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";

const TYPE_CONFIG: Record<
  TaskType,
  { bg: string; icon: typeof CheckSquare }
> = {
  task: { bg: "bg-blue-100", icon: CheckSquare },
  invitation: { bg: "bg-purple-100", icon: Calendar },
  observation: { bg: "bg-green-100", icon: ClipboardList },
};

type TaskCardProps = {
  task: Task;
  assignedToName?: string | null;
  createdByName?: string | null;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
};

export function TaskCard({
  task,
  assignedToName,
  createdByName,
  onDelete,
  onStatusChange,
}: TaskCardProps) {
  const status = task.status ?? "pending";
  const isPending = status === "pending";
  const config = TYPE_CONFIG[task.type];
  const Icon = config.icon;
  const deadlineDate = task.deadline ? parseISO(task.deadline) : null;
  const isOverdue = deadlineDate ? isPast(deadlineDate) : false;
  const deadlineLabel = deadlineDate
    ? format(deadlineDate, "d MMMM yyyy", { locale: pl })
    : "—";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Czy na pewno chcesz usunąć ten element?")) {
      onDelete(task.id);
    }
  };

  return (
    <Card className="border-slate-200 transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${config.bg} text-slate-800`}>
              {TASK_TYPE_LABELS[task.type]}
            </Badge>
            <Badge variant="outline" className="text-slate-600">
              {TASK_STATUS_LABELS[status]}
            </Badge>
            <span className="flex items-center text-slate-500">
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isPending && onStatusChange && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-800"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStatusChange(task.id, "completed");
                  }}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Zrealizowane
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-red-600"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStatusChange(task.id, "cancelled");
                  }}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Anuluj
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/tasks/${task.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        </div>

        <p className="mt-2 font-semibold text-slate-900">{task.description}</p>

        <div className="mt-2 space-y-1 text-sm text-slate-600">
          {assignedToName && (
            <p>
              <span className="text-slate-500">Przypisane do:</span> {assignedToName}
            </p>
          )}
          <p className={isOverdue ? "text-red-600 font-medium" : ""}>
            <span className="text-slate-500">Deadline:</span> {deadlineLabel}
            {isOverdue && " (Przekroczony!)"}
          </p>
        </div>

        {task.type === "invitation" && (
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            {task.location && <p>Lokalizacja: {task.location}</p>}
            {task.meeting_date && (
              <p>
                Data spotkania:{" "}
                {format(parseISO(task.meeting_date), "d MMM yyyy, HH:mm", { locale: pl })}
              </p>
            )}
            {task.inviter_info && <p>Zapraszający: {task.inviter_info}</p>}
          </div>
        )}

        {task.type === "observation" && (
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            {task.observation_location && (
              <p>Miejsce obserwacji: {task.observation_location}</p>
            )}
            {task.observation_date && (
              <p>
                Data obserwacji:{" "}
                {format(parseISO(task.observation_date), "d MMM yyyy, HH:mm", { locale: pl })}
              </p>
            )}
            {task.player_names?.length ? (
              <p>Zawodnicy: {task.player_names.join(", ")}</p>
            ) : null}
            {task.observation_source && (
              <p>Źródło zaproszenia: {task.observation_source}</p>
            )}
          </div>
        )}

        <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
          Utworzono:{" "}
          {task.created_at
            ? format(parseISO(task.created_at), "dd MMM yyyy, HH:mm", { locale: pl })
            : "—"}{" "}
          przez {createdByName ?? "—"}
        </div>
      </CardContent>
    </Card>
  );
}
