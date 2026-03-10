import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Observation } from "../types";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { Flag, ImageIcon, Star, TrendingUp } from "lucide-react";
import { formatPosition } from "@/features/players/positions";

type ObservationCardProps = {
  observation: Observation;
};

function getCategoryLabel(category: Observation["observation_category"]): string {
  if (category === "match_player") return "Obserwacja meczowa";
  if (category === "individual") return "Obserwacja indywidualna";
  return "";
}

function getFormTypeLabel(formType: Observation["form_type"]): string {
  if (formType === "simplified") return "Formularz uproszczony";
  if (formType === "extended") return "Formularz rozszerzony";
  if (formType === "academy") return "Akademia";
  if (formType === "senior") return "Senior";
  return "";
}

function getRecommendationLabel(recommendation: Observation["recommendation"]): string {
  if (recommendation === "positive") return "Pozytywna";
  if (recommendation === "negative") return "Negatywna";
  if (recommendation === "to_observe") return "Do obserwacji";
  return "";
}

export function ObservationCard({ observation }: ObservationCardProps) {
  const player = observation.player;
  const dateLabel = observation.observation_date
    ? format(parseISO(observation.observation_date), "dd.MM.yyyy")
    : "-";
  const currentYear = new Date().getFullYear();
  const ageLabel = player?.birth_year ? `${currentYear - player.birth_year} lat` : "-";
  const positionLabel = formatPosition(player?.primary_position ?? "");
  const rating = observation.overall_rating;
  const ratingClass =
    typeof rating === "number" && rating >= 8
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      : typeof rating === "number" && rating >= 6
        ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
        : "bg-slate-100 text-slate-700 hover:bg-slate-100";
  const hasMedia = Boolean(observation.photo_url?.trim());

  const category = observation.observation_category;
  const categoryLabel = getCategoryLabel(category);
  const showFormType =
    (category === "individual" &&
      (observation.form_type === "simplified" || observation.form_type === "extended")) ||
    (category === "match_player" &&
      (observation.form_type === "academy" || observation.form_type === "senior"));
  const formTypeLabel = getFormTypeLabel(observation.form_type);
  const recommendationLabel = getRecommendationLabel(observation.recommendation);
  const hasRecommendation = Boolean(observation.recommendation);
  const recommendationClass =
    observation.recommendation === "positive"
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      : observation.recommendation === "negative"
        ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
        : "bg-amber-100 text-amber-700 hover:bg-amber-100";

  const hasPotential =
    typeof observation.potential_now === "number" ||
    typeof observation.potential_future === "number";

  return (
    <Link to={`/observations/${observation.id}`} className="block relative">
      <Card className="border border-slate-200 transition-all duration-200 hover:scale-[1.01] hover:bg-slate-50 hover:shadow-lg">
        <CardContent className="p-5">
          {/* Górny wiersz: imię, wiek, pozycja | ocena, multimedia, rekomendacja */}
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-slate-900 md:text-lg">
                  {player?.first_name} {player?.last_name}
                </span>
                <Badge className="w-fit justify-center rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                  {ageLabel}
                </Badge>
                {player?.primary_position && (
                  <Badge className="w-fit justify-center rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                    {positionLabel}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasMedia && (
                <span
                  className="flex items-center rounded-full bg-slate-100 p-1.5 text-slate-500"
                  title="Obserwacja ma multimedia"
                  aria-label="Obserwacja ma multimedia"
                >
                  <ImageIcon className="h-4 w-4" />
                </span>
              )}
              {typeof rating === "number" && (
                <Badge className={`flex items-center gap-1 rounded-full px-2 text-xs ${ratingClass}`}>
                  <Star className="h-3.5 w-3.5" />
                  {rating}
                </Badge>
              )}
              {hasRecommendation && (
                <Badge
                  className={`flex items-center gap-1 rounded-full px-2 text-xs ${recommendationClass}`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {recommendationLabel}
                </Badge>
              )}
            </div>
          </div>

          {/* Środkowa sekcja: klub, rozgrywki, typ obserwacji, typ formularza, potencjał */}
          <div className="mt-3 space-y-2">
            <div className="text-sm text-slate-600">
              {(player?.club?.name ?? "Brak klubu") +
                (observation.competition ? ` • ${observation.competition}` : "")}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categoryLabel && (
                <Badge
                  className={
                    category === "match_player"
                      ? "w-fit rounded-full bg-sky-100 px-2 text-xs text-sky-700 hover:bg-sky-100"
                      : "w-fit rounded-full bg-violet-100 px-2 text-xs text-violet-700 hover:bg-violet-100"
                  }
                >
                  {categoryLabel}
                </Badge>
              )}
              {showFormType && formTypeLabel && (
                <Badge
                  className={
                    observation.form_type === "simplified"
                      ? "w-fit rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100"
                      : "w-fit rounded-full bg-indigo-100 px-2 text-xs text-indigo-700 hover:bg-indigo-100"
                  }
                >
                  {formTypeLabel}
                </Badge>
              )}
            </div>
            {hasPotential && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <span>
                  Performance:{" "}
                  {typeof observation.potential_now === "number" && (
                    <strong>{observation.potential_now}</strong>
                  )}
                  {typeof observation.potential_now === "number" &&
                    typeof observation.potential_future === "number" &&
                    " / "}
                  {typeof observation.potential_future === "number" && (
                    <>przyszłość <strong>{observation.potential_future}</strong></>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Dolna sekcja: podsumowanie (line-clamp), data i autor */}
          {observation.summary?.trim() && (
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">{observation.summary.trim()}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>{dateLabel}</span>
            {observation.created_by_name?.trim() && (
              <span>· {observation.created_by_name.trim()}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
