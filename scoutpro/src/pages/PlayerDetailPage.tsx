import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { usePipelineHistory, usePlayer } from "@/features/players/hooks/usePlayers";
import { PlayerProfile } from "@/features/players/components/PlayerProfile";
import { useObservationsByPlayer } from "@/features/observations/hooks/useObservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Star } from "lucide-react";
import { ALL_PIPELINE_STATUSES } from "@/features/pipeline/types";
import { supabase } from "@/lib/supabase";

export function PlayerDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { data, isLoading } = usePlayer(id ?? "");
  const { data: observations = [], isLoading: isObsLoading } = useObservationsByPlayer(id ?? "");
  const { data: history = [], isLoading: isHistoryLoading } = usePipelineHistory(id ?? "");
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const userIds = useMemo(() => {
    const ids = new Set<string>();
    observations.forEach((obs) => {
      if (obs.scout_id) ids.add(obs.scout_id);
    });
    history.forEach((entry) => {
      if (entry.changed_by) ids.add(entry.changed_by);
    });
    return Array.from(ids);
  }, [observations, history]);

  useEffect(() => {
    if (!userIds.length) return;
    let isMounted = true;
    const loadUsers = async () => {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", userIds);
      if (error || !isMounted) return;
      const nextMap: Record<string, string> = {};
      users?.forEach((user) => {
        if (user.id) nextMap[user.id] = user.full_name ?? "";
      });
      setUserMap(nextMap);
    };
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [userIds]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie...</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Nie znaleziono zawodnika.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6">
      <PlayerProfile player={data} />

      <Tabs defaultValue="observations">
        <TabsList className="rounded-full bg-slate-100">
          <TabsTrigger
            value="observations"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Obserwacje ({observations.length})
          </TabsTrigger>
          <TabsTrigger
            value="pipeline"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Historia Pipeline
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Kontakty
          </TabsTrigger>
        </TabsList>

        <TabsContent value="observations" className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button asChild className="gap-2 bg-red-600 hover:bg-red-700">
              <Link to={`/observations/new?playerId=${data.id}`}>
                <Plus className="h-4 w-4" />
                Dodaj obserwacje
              </Link>
            </Button>
          </div>
          {isObsLoading && <p className="text-sm text-slate-500">Ladowanie...</p>}
          {!isObsLoading && observations.length === 0 && (
            <p className="text-sm text-slate-500">Brak obserwacji.</p>
          )}
          {!isObsLoading &&
            observations.map((observation) => {
              const dateLabel = observation.observation_date
                ? format(parseISO(observation.observation_date), "dd.MM.yyyy")
                : "-";
              const rating = observation.overall_rating;
              const ratingClass =
                typeof rating === "number" && rating >= 8
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  : typeof rating === "number" && rating >= 6
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-100";
              return (
                <Card
                  key={observation.id}
                  className="cursor-pointer border-slate-200 transition hover:border-slate-300 hover:shadow-sm"
                  onClick={() => navigate(`/observations/${observation.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-base font-semibold text-slate-900">
                          {observation.competition ?? "Obserwacja"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {dateLabel}
                          {observation.scout_id && userMap[observation.scout_id]
                            ? ` • Scout: ${userMap[observation.scout_id]}`
                            : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof rating === "number" && (
                          <Badge className={`flex items-center gap-1 rounded-full px-2 ${ratingClass}`}>
                            <Star className="h-3.5 w-3.5" />
                            {rating}
                          </Badge>
                        )}
                        <Button asChild size="icon" variant="outline">
                          <Link
                            to={`/observations/${observation.id}/edit`}
                            aria-label="Edytuj obserwacje"
                            state={{ from: `${location.pathname}${location.search}` }}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    {observation.notes && (
                      <p className="mt-3 text-sm text-slate-600">{observation.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">Historia zmian statusu</div>
              {isHistoryLoading && <div>Ladowanie historii...</div>}
              {!isHistoryLoading && history.length === 0 && (
                <div>Brak historii zmian statusu.</div>
              )}
              {!isHistoryLoading &&
                history.map((entry, index) => {
                  const statusLabel =
                    ALL_PIPELINE_STATUSES.find((column) => column.id === entry.to_status)?.label ??
                    entry.to_status;
                  const author = userMap[entry.changed_by] ?? "Scout";
                  const dateLabel = entry.created_at
                    ? format(parseISO(entry.created_at), "dd.MM.yyyy")
                    : "-";
                  return (
                    <div
                      key={entry.id}
                      className={[
                        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                        index < history.length - 1 ? "border-b border-slate-100 pb-3" : "",
                      ].join(" ")}
                    >
                      <div className="space-y-1">
                        <Badge className="w-fit rounded-full bg-blue-100 px-2 text-xs text-blue-700 hover:bg-blue-100">
                          {statusLabel}
                        </Badge>
                        <div className="text-sm text-slate-600">przez {author}</div>
                      </div>
                      <div className="text-sm text-slate-500">{dateLabel}</div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">Kontakty</div>
              {data.guardian_name || data.guardian_phone || data.guardian_email ? (
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">Rodzic/Opiekun</div>
                  <div className="text-sm text-slate-700">{data.guardian_name ?? "-"}</div>
                  <div className="text-sm text-slate-700">{data.guardian_phone ?? "-"}</div>
                  <div className="text-sm text-slate-700">{data.guardian_email ?? "-"}</div>
                </div>
              ) : (
                <div>Brak danych kontaktowych.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
