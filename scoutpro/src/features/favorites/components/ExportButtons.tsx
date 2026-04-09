import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import type { FavoriteList } from "../types";
import type { FavoriteListMember } from "../types";
import { exportFavoriteListToExcel, exportFavoriteListToPdf } from "../utils/exportFavorites";

/** Slot for export (legacy SlotCount or SlotWithCoords). */
type SlotForExport = { positionCode: string; label: string; count: number; playerIds: string[] };

type ExportButtonsProps = {
  list: FavoriteList;
  members: FavoriteListMember[];
  slots: SlotForExport[];
};

export function ExportButtons({ list, members, slots }: ExportButtonsProps) {
  const handleExcel = () => {
    exportFavoriteListToExcel(list, members, slots);
  };

  const handlePdf = () => {
    exportFavoriteListToPdf(list, members);
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
