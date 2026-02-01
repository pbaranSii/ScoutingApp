import { useState } from "react";
import { usePlayers } from "@/features/players/hooks/usePlayers";
import { PlayerList } from "@/features/players/components/PlayerList";
import { PlayerForm } from "@/features/players/components/PlayerForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function PlayersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = usePlayers({ search });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Zawodnicy</h1>
          <p className="text-sm text-slate-600">
            Lista zawodnikow z bazy scoutingowej.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Dodaj zawodnika</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nowy zawodnik</DialogTitle>
            </DialogHeader>
            <PlayerForm onCreated={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Szukaj po nazwisku lub imieniu"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <PlayerList players={data} isLoading={isLoading} />
    </div>
  );
}
