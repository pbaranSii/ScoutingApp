import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useMatchObservationNew } from "@/pages/MatchObservationNewLayout";
import { MatchObservationPlayerForm } from "@/features/observations/components/MatchObservationPlayerForm";
import type { MatchPlayerSlot } from "@/features/observations/types";

function nextId() {
  return crypto.randomUUID();
}

export function MatchObservationPlayerFormPage() {
  const { slotId } = useParams<{ slotId: string }>();
  const navigate = useNavigate();
  const { players, setPlayers, headerTeamNames } = useMatchObservationNew();

  const slot = slotId ? players.find((p) => p.id === slotId) : null;
  const isEdit = Boolean(slotId && slot);

  const handleSave = (data: Omit<MatchPlayerSlot, "id">) => {
    if (slotId && slot) {
      setPlayers((prev) => prev.map((p) => (p.id === slotId ? { ...data, id: slotId } : p)));
    } else {
      const id = nextId();
      setPlayers((prev) => [...prev, { ...data, id }]);
    }
    navigate("/observations/match/new");
  };

  const handleCancel = () => {
    navigate("/observations/match/new");
  };

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <PageHeader
        title={isEdit ? "Edycja zawodnika" : "Dodaj zawodnika"}
        subtitle={isEdit ? "Zmiany zapiszą się po powrocie do listy" : "Wypełnij formularz i zapisz"}
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link to="/observations/match/new">
              <ArrowLeft className="h-4 w-4" />
              Wróć do obserwacji meczowej
            </Link>
          </Button>
        }
      />
      <div className="h-px bg-slate-200" />
      <MatchObservationPlayerForm
        initialData={slot ?? undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        headerTeamNames={headerTeamNames.filter(Boolean)}
      />
    </div>
  );
}
