export type CsvRow = Record<string, string>;

function stripBom(text: string) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Minimal RFC4180-ish CSV parser.
 * - Comma-separated
 * - Quotes supported ("")
 * - Newlines allowed in quoted fields
 */
export function parseCsv(text: string): string[][] {
  const s = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        const next = s[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (c === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }

  row.push(field);
  rows.push(row);

  // Remove trailing empty rows
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.every((v) => v.trim() === "")) rows.pop();
    else break;
  }

  return rows;
}

export function rowsToObjects(rows: string[][]): CsvRow[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const result: CsvRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((v) => (v ?? "").trim() === "")) continue;
    const obj: CsvRow = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (!key) continue;
      obj[key] = (r[j] ?? "").trim();
    }
    result.push(obj);
  }
  return result;
}

export function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "tak" || v === "yes" || v === "y") return true;
  if (v === "0" || v === "false" || v === "nie" || v === "no" || v === "n") return false;
  return undefined;
}

export function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (v === "") return undefined;
  const n = Number(v.replace(",", "."));
  if (Number.isFinite(n)) return n;
  return undefined;
}

