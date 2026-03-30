import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { useMyTasks } from "../hooks/useDashboard";

export function MyTasksCard() {
  const { data = [], isLoading } = useMyTasks(8);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Moje zadania</CardTitle>
        <Link
          to="/tasks"
          className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
        >
          Zobacz wszystkie
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-slate-500">Ładowanie...</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-slate-500">Brak zadań.</p>
        )}
        {data.map((task) => (
          <div
            key={task.id}
            className="rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-50"
          >
            <div className="font-medium text-slate-900 line-clamp-2">
              {task.description}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              <span>
                {task.deadline
                  ? format(parseISO(task.deadline), "dd.MM.yyyy")
                  : "-"}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                {task.status === "pending"
                  ? "Do zrobienia"
                  : task.status === "completed"
                    ? "Wykonane"
                    : task.status}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
