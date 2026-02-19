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
import { AddToFavoritesButton } from "@/features/favorites/components/AddToFavoritesButton";
import { ALL_PIPELINE_STATUSES } from "@/features/pipeline/types";
import { supabase } from "@/lib/supabase";
import {
  MediaGallery,
  MediaUploadModal,
  useMultimediaByPlayer,
  useUploadMediaFile,
  useAddYoutubeLink,
  useDeleteMultimedia,
} from "@/features/multimedia";
import { MULTIMEDIA_TABLE_MISSING_CODE } from "@/features/multimedia/api/multimedia.api";
import { buildLegacyMediaItems } from "@/features/multimedia/lib/legacyMedia";
import { MAX_MEDIA_PER_OBSERVATION } from "@/features/multimedia/types";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";

export function PlayerDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const playerId = id ?? "";
  const { data, isLoading } = usePlayer(playerId);
  const { data: observations = [], isLoading: isObsLoading } = useObservationsByPlayer(playerId);
  const { data: history = [], isLoading: isHistoryLoading } = usePipelineHistory(playerId);
  const { data: mediaItems = [], isError: isMultimediaError, error: multimediaError } = useMultimediaByPlayer(playerId);
  const multimediaTableMissing =
    isMultimediaError &&
    multimediaError instanceof Error &&
    (multimediaError as Error & { code?: string }).code === MULTIMEDIA_TABLE_MISSING_CODE;
  const legacyItems = useMemo(
    () => (data ? buildLegacyMediaItems(data, observations) : []),
    [data, observations]
  );
  const combinedMedia = useMemo(
    () => [...(mediaItems ?? []), ...legacyItems],
    [mediaItems, legacyItems]
  );
  const { user } = useAuthStore();
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [addMediaModalOpen, setAddMediaModalOpen] = useState(false);
  const [profileMediaObservationId, setProfileMediaObservationId] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video" | "youtube_link">("all");
  const uploadProfileMedia = useUploadMediaFile(id ?? "", profileMediaObservationId);
  const addProfileYoutube = useAddYoutubeLink(id ?? "", profileMediaObservationId);
  const deleteProfileMedia = useDeleteMultimedia(id ?? "");

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
      <PlayerProfile
        player={data}
        additionalActions={
          <AddToFavoritesButton
            playerId={data.id}
            playerName={`${data.first_name} ${data.last_name}`}
            size="default"
            variant="outline"
            showCount
            className="min-w-[4rem]"
          />
        }
      />

      <Tabs defaultValue="observations">
        <TabsList className="rounded-full bg-slate-100">
          <TabsTrigger
            value="observations"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Obserwacje ({observations.length})
          </TabsTrigger>
          <TabsTrigger
            value="multimedia"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            Multimedia ({combinedMedia.length})
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

        <TabsContent value="multimedia" className="space-y-4">
          {multimediaTableMissing && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Multimedia nie są jeszcze skonfigurowane na bazie. Poniżej wyświetlane są zapisane wcześniej linki (zdjęcia, wideo).
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              Zdjęcia, wideo i linki YouTube powiązane z zawodnikiem.
            </p>
            {!multimediaTableMissing && (
              <Button
                type="button"
                className="gap-2 bg-red-600 hover:bg-red-700"
                onClick={() => setAddMediaModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Dodaj multimedia do profilu
              </Button>
            )}
          </div>
          <MediaGallery
            items={combinedMedia}
            filter={mediaFilter}
            onFilterChange={setMediaFilter}
            onDelete={async (mediaId) => {
              try {
                await deleteProfileMedia.mutateAsync(mediaId);
                toast({ title: "Plik usunięty" });
              } catch {
                toast({
                  variant: "destructive",
                  title: "Nie udało się usunąć pliku",
                });
              }
            }}
            emptyMessage="Brak multimediów. Dodaj zdjęcia, wideo lub linki YouTube z obserwacji lub tutaj."
          />
          <MediaUploadModal
            open={addMediaModalOpen}
            onOpenChange={setAddMediaModalOpen}
            title="Dodaj multimedia do profilu zawodnika"
            maxFiles={MAX_MEDIA_PER_OBSERVATION}
            currentCount={mediaItems?.length ?? 0}
            observationOptions={observations.map((o) => ({
              value: o.id,
              label: `${o.competition ?? "Obserwacja"} ${format(parseISO(o.observation_date ?? ""), "dd.MM.yyyy")}`,
            }))}
            selectedObservationId={profileMediaObservationId}
            onObservationIdChange={setProfileMediaObservationId}
            onFilesSelected={async (files) => {
              if (!user?.id) return;
              for (const file of files) {
                try {
                  await uploadProfileMedia.mutateAsync({ file, createdBy: user.id });
                  toast({ title: "Plik dodany" });
                } catch {
                  toast({
                    variant: "destructive",
                    title: "Nie udało się dodać pliku",
                  });
                }
              }
            }}
            onYoutubeAdd={async ({ url, videoId, thumbnailUrl }) => {
              if (!user?.id) return;
              try {
                await addProfileYoutube.mutateAsync({
                  youtubeUrl: url,
                  videoId,
                  createdBy: user.id,
                  thumbnailUrl,
                });
                toast({ title: "Link YouTube dodany" });
              } catch {
                toast({
                  variant: "destructive",
                  title: "Nie udało się dodać linku",
                });
              }
            }}
          />
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
