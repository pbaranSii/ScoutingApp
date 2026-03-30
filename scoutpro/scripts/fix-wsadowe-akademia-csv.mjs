import fs from "node:fs/promises";
import path from "node:path";

function toIsoDate(value) {
  const t = String(value ?? "").trim();
  if (!t) return "";
  const m = t.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return t;
  return t; // leave as-is; better than corrupting
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const inputPath =
  process.argv[2] ??
  "C:\\\\Projekty\\\\CursorAplications\\\\ScoutApp Materiały\\\\Dane KS Polonia\\\\wsadowe_akademia .csv";

const outPath =
  process.argv[3] ??
  path.join(path.dirname(inputPath), "wsadowe_akademia_fixed.csv");

const raw = await fs.readFile(inputPath, "utf8");
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
if (lines.length === 0) {
  console.error("Empty input CSV:", inputPath);
  process.exit(1);
}

// Expect: first_name;last_name;birth_year;observation_date;scout_name;potential_future_raw
const header = lines[0].trim();
const headerCols = header.split(";");
if (headerCols.length < 6) {
  console.error("Unexpected header (expected ';' separated 6+ columns):", header);
  process.exit(1);
}

const out = [];
out.push("first_name,last_name,birth_year,observation_date,scout_name,potential_future_raw");

for (let i = 1; i < lines.length; i += 1) {
  const cols = lines[i].split(";");
  const first_name = cols[0] ?? "";
  const last_name = cols[1] ?? "";
  const birth_year = cols[2] ?? "";
  const observation_date = toIsoDate(cols[3] ?? "");
  const scout_name = cols[4] ?? "";
  const potential_future_raw = cols[5] ?? "";
  out.push(
    [
      csvEscape(first_name.trim()),
      csvEscape(last_name.trim()),
      csvEscape(String(birth_year).trim()),
      csvEscape(observation_date),
      csvEscape(String(scout_name).trim()),
      csvEscape(String(potential_future_raw).trim()),
    ].join(",")
  );
}

await fs.writeFile(outPath, out.join("\n") + "\n", "utf8");
console.log("Wrote:", outPath);

