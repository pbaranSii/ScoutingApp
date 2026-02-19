import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import type { FavoriteList } from "../types";
import type { FavoriteListMember } from "../types";
import type { SlotCount } from "./formations";
import { format, parseISO } from "date-fns";

export function exportFavoriteListToExcel(
  list: FavoriteList,
  members: (FavoriteListMember & { player?: { overall_rating?: number | null } })[],
  slots: SlotCount[],
  averageRating: number | null
) {
  const wb = XLSX.utils.book_new();

  const infoRows = [
    ["Nazwa listy", list.name],
    ["Opis", list.description ?? ""],
    ["Właściciel", (list as { owner?: { full_name?: string } }).owner?.full_name ?? list.owner_id],
    ["Data utworzenia", list.created_at ? format(parseISO(list.created_at), "yyyy-MM-dd HH:mm") : ""],
    ["Liczba zawodników", (list as { players_count?: number }).players_count ?? members.length],
    ["Średnia ocena", averageRating != null ? String(averageRating) : ""],
    ["Formacja", list.formation],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
  XLSX.utils.book_append_sheet(wb, wsInfo, "Informacje o liście");

  const playerHeaders = [
    "Lp.",
    "Imię",
    "Nazwisko",
    "Rok urodzenia",
    "Wiek",
    "Pozycja",
    "Klub",
    "Ocena",
    "Status pipeline",
  ];
  const currentYear = new Date().getFullYear();
  const playerRows = members.map((m, i) => {
    const p = m.player;
    const age = p?.birth_year ? currentYear - p.birth_year : "";
    return [
      i + 1,
      p?.first_name ?? "",
      p?.last_name ?? "",
      p?.birth_year ?? "",
      age,
      p?.primary_position ?? "",
      (p?.club as { name?: string })?.name ?? "",
      (p as { overall_rating?: number })?.overall_rating ?? "",
      p?.pipeline_status ?? "",
    ];
  });
  const wsPlayers = XLSX.utils.aoa_to_sheet([playerHeaders, ...playerRows]);
  XLSX.utils.book_append_sheet(wb, wsPlayers, "Zawodnicy");

  const slotHeaders = ["Pozycja", "Liczba zawodników", "Status"];
  const slotRows = slots.map((s) => [
    s.positionCode,
    s.count,
    s.count === 0 ? "Brak" : s.count >= 2 && s.count <= 3 ? "OK" : s.count === 1 ? "Potrzeba backup" : "Nadmiar",
  ]);
  const wsSlots = XLSX.utils.aoa_to_sheet([slotHeaders, ...slotRows]);
  XLSX.utils.book_append_sheet(wb, wsSlots, "Analiza pozycji");

  const filename = `Lista_${list.name.replace(/[^\w\s-]/g, "")}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportFavoriteListToPdf(
  list: FavoriteList,
  members: (FavoriteListMember & { player?: { overall_rating?: number | null } })[],
  averageRating: number | null
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const margin = 40;
  let y = 40;

  pdf.setFontSize(18);
  pdf.text(list.name, margin, y);
  y += 24;
  pdf.setFontSize(10);
  pdf.text(`Opis: ${list.description ?? "—"}`, margin, y);
  y += 16;
  pdf.text(`Zawodników: ${members.length}`, margin, y);
  y += 16;
  if (averageRating != null) pdf.text(`Średnia ocena: ${averageRating}/10`, margin, y);
  y += 16;
  pdf.text(`Formacja: ${list.formation}`, margin, y);
  y += 24;

  pdf.setFontSize(12);
  pdf.text("Zawodnicy", margin, y);
  y += 16;
  pdf.setFontSize(9);
  members.forEach((m, i) => {
    if (y > 750) {
      pdf.addPage();
      y = 40;
    }
    const p = m.player;
    const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "—";
    const club = (p?.club as { name?: string })?.name ?? "";
    pdf.text(`${i + 1}. ${name}${club ? ` (${club})` : ""}`, margin, y);
    y += 14;
  });
  const filename = `Lista_${list.name.replace(/[^\w\s-]/g, "")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  pdf.save(filename);
}
