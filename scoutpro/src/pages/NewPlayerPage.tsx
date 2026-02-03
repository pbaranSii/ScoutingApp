import { useNavigate } from "react-router-dom";
import { PlayerForm } from "@/features/players/components/PlayerForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";

export function NewPlayerPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4">
      <PageHeader
        title="Nowy zawodnik"
        subtitle="Wypelnij informacje o zawodniku."
        actions={
          <Button variant="outline" type="button" onClick={() => navigate("/players")}>
            Wroc do listy
          </Button>
        }
      />

      <PlayerForm onCreated={() => navigate("/players")} />
    </div>
  );
}
