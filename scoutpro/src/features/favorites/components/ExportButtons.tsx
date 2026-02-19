import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import type { FavoriteList } from "../types";
import type { FavoriteListMember } from "../types";
import type { SlotCount } from "../utils/formations";
import { exportFavoriteListToExcel, exportFavoriteListToPdf } from "../utils/exportFavorites";

type ExportButtonsProps = {
  list: FavoriteList;
  members: (FavoriteListMember & { player?: { overall_rating?: number | null } })[];
  slots: SlotCount[];
  averageRating: number | null;
};

export function ExportButtons({ list, members, slots, averageRating }: ExportButtonsProps) {
  const handleExcel = () => {
    exportFavoriteListToExcel(list, members, slots, averageRating);
  };

  const handlePdf = () => {
    exportFavoriteListToPdf(list, members, averageRating);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExcel} className="gap-1">
        <FileSpreadsheet className="h-4 w-4" />
        Eksportuj do Excel
      </Button>
      <Button variant="outline" size="sm" onClick={handlePdf} className="gap-1">
        <FileText className="h-4 w-4" />
        Eksportuj do PDF
      </Button>
    </div>
  );
}
