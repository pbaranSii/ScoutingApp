import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, content: string) {
  downloadBlob(filename, new Blob([content], { type: "text/plain;charset=utf-8" }));
}

export function toCsv(rows: Record<string, string | number | null | undefined>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  // UTF-8 BOM helps Excel on Windows.
  return "\uFEFF" + lines.join("\n");
}

export async function exportElementAsPng(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, { backgroundColor: "#ffffff", scale: 2 });
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Failed to create PNG blob");
  downloadBlob(filename, blob);
}

export async function exportElementAsPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, { backgroundColor: "#ffffff", scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

  const w = imgWidth * ratio;
  const h = imgHeight * ratio;
  const x = (pageWidth - w) / 2;
  const y = (pageHeight - h) / 2;

  pdf.addImage(imgData, "PNG", x, y, w, h);
  pdf.save(filename);
}

