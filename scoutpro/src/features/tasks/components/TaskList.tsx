import type { Task, TaskStatus } from "../types";
import { TaskCard } from "./TaskCard";

type TaskListProps = {
  tasks: Task[];
  isLoading: boolean;
  getUserName: (userId: string) => string | null;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
};

export function TaskList({
  tasks,
  isLoading,
  getUserName,
  onDelete,
  onStatusChange,
}: TaskListProps) {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Ładowanie...</p>;
  }

  if (!tasks.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        Brak zadań i zaproszeń.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          assignedToName={task.assigned_to ? getUserName(task.assigned_to) : null}
          createdByName={task.created_by ? getUserName(task.created_by) : null}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
