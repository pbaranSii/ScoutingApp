import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FavoriteList } from "../types";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Heart, Pencil, Trash2, Users } from "lucide-react";

type FavoriteListCardProps = {
  list: FavoriteList;
  isOwner: boolean;
  onEdit: (list: FavoriteList) => void;
  onDelete: (list: FavoriteList) => void;
};

export function FavoriteListCard({ list, isOwner, onEdit, onDelete }: FavoriteListCardProps) {
  const count = (list as FavoriteList & { players_count?: number }).players_count ?? 0;
  const lastUsed = list.last_used_at ? format(parseISO(list.last_used_at), "d MMM yyyy", { locale: pl }) : "—";
  const ownerName = (list as FavoriteList & { owner?: { full_name?: string | null } }).owner?.full_name?.trim() ?? "—";
  const hasCollaborators = list.region_id != null;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Czy na pewno chcesz usunąć listę „${list.name}"? Tej operacji nie można cofnąć.`)) {
      onDelete(list);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(list);
  };

  return (
    <Link to={`/favorites/${list.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900 truncate">{list.name}</span>
                {hasCollaborators && (
                  <Badge variant="secondary" className="text-xs">
                    Udostępniona
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {count} zawodników · {list.formation}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {ownerName} · {lastUsed}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEdit} title="Edytuj">
                <Pencil className="h-4 w-4" />
              </Button>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                  title="Usuń listę"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-slate-500">
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <Users className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
