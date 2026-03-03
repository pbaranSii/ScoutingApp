import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { ObservationWizard } from "@/features/observations/components/ObservationWizard";
import { PlayerSearchDialog } from "@/features/observations/components/PlayerSearchDialog";
import type { PlayerSearchItem } from "@/features/players/api/players.api";
import { Search } from "lucide-react";

export function IndividualObservationNewPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const prefillPlayer = selectedPlayer
    ? {
        id: selectedPlayer.id,
        first_name: selectedPlayer.first_name ?? "",
        last_name: selectedPlayer.last_name ?? "",
        birth_year: selectedPlayer.birth_year ?? new Date().getFullYear() - 16,
        club_name: selectedPlayer.club?.name,
        primary_position: selectedPlayer.primary_position ?? undefined,
      }
    : undefined;

  if (selectedPlayer) {
    return (
      <div className="mx-auto w-full max-w-[960px] space-y-4">
        <PageHeader
          title="Obserwacja indywidualna"
          subtitle={`Zawodnik: ${selectedPlayer.first_name} ${selectedPlayer.last_name}`}
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedPlayer(null)}
            >
              Wybierz innego zawodnika
            </Button>
          }
        />
        <ObservationWizard
          prefillPlayer={prefillPlayer}
          lockPlayerFields={true}
          cancelHref="/observations"
          defaultFormType="extended"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Obserwacja indywidualna"
        subtitle="Wyszukaj zawodnika z bazy (wymagane)"
      />
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="mb-4 text-slate-600">
          Obserwacja indywidualna wymaga wyboru zawodnika z bazy. Wyszukaj po imieniu lub nazwisku.
        </p>
        <Button onClick={() => setSearchOpen(true)} className="gap-2">
          <Search className="h-4 w-4" />
          Wyszukaj zawodnika
        </Button>
        <div className="mt-4">
          <Button asChild variant="link">
            <Link to="/observations">Wróć do listy obserwacji</Link>
          </Button>
        </div>
      </div>
      <PlayerSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPlayer={(player) => {
          setSelectedPlayer(player);
          setSearchOpen(false);
        }}
        onAddNew={() => {}}
      />
    </div>
  );
}
