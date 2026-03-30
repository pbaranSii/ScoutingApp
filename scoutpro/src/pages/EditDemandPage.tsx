import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft } from "lucide-react";
import { DemandForm } from "@/features/demands/components/DemandForm";
import { usePlayerDemand } from "@/features/demands/hooks";

export function EditDemandPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: demand, isLoading } = usePlayerDemand(id ?? null);

  if (isLoading || !id) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/demands/${id}`} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Powrót do szczegółów
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Edycja zapotrzebowania"
        subtitle={`${demand.position} · ${demand.season}`}
      />
      <DemandForm
        mode="edit"
        demandId={id}
        onSuccess={() => navigate(`/demands/${id}`)}
      />
    </div>
  );
}
