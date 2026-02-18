import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { pl } from "date-fns/locale";
import type { Task, TaskType } from "../types";
import { TASK_TYPE_LABELS } from "../types";
import { Link } from "react-router-dom";

const TYPE_BG: Record<TaskType, string> = {
  task: "bg-blue-100",
  invitation: "bg-purple-100",
  observation: "bg-green-100",
};

const WEEKDAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

type CalendarViewProps = {
  tasks: Task[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
};

export function CalendarView({
  tasks,
  isLoading,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (!task.deadline) return;
      const dayKey = task.deadline;
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey)!.push(task);
    });
    map.forEach((arr) => arr.sort((a, b) => a.deadline.localeCompare(b.deadline)));
    return map;
  }, [tasks]);

  const goPrev = () => setCurrentMonth((d) => subMonths(d, 1));
  const goNext = () => setCurrentMonth((d) => addMonths(d, 1));
  const goToday = () => setCurrentMonth(new Date());
  const today = new Date();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ładowanie...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
          >
            →
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
          >
            Dziś
          </button>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          {format(currentMonth, "LLLL yyyy", { locale: pl })}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-lg border border-slate-200 bg-slate-200">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-white p-2 text-center text-sm font-semibold text-slate-600"
          >
            {label}
          </div>
        ))}
        {calendarDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(dayKey) ?? [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={dayKey}
              className={`min-h-[120px] bg-white p-2 text-sm ${
                isCurrentMonth ? "" : "bg-slate-50"
              } ${isToday ? "border-2 border-primary" : "border border-slate-200"}`}
            >
              <div
                className={`mb-1 ${
                  isCurrentMonth ? "text-slate-900" : "text-slate-400"
                } ${isToday ? "font-bold text-primary" : ""}`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}/edit`}
                    className={`block truncate rounded p-1 text-xs opacity-100 hover:opacity-80 ${TYPE_BG[task.type]}`}
                    title={task.description}
                  >
                    {task.description}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-blue-100" />
          {TASK_TYPE_LABELS.task}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-purple-100" />
          {TASK_TYPE_LABELS.invitation}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-green-100" />
          {TASK_TYPE_LABELS.observation}
        </span>
      </div>
    </div>
  );
}
