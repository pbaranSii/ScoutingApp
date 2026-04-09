import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function getArg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  return v && !v.startsWith("--") ? v : fallback;
}

async function loadDotEnvIfPresent(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!key) continue;
      if (process.env[key] === undefined) process.env[key] = value;
    }
    return true;
  } catch {
    return false;
  }
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const cols = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r ?? {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  ).sort();

  const header = cols.map(csvEscape).join(",");
  const body = rows
    .map((r) => cols.map((c) => csvEscape(r?.[c])).join(","))
    .join("\n");
  return `${header}\n${body}\n`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fetchAll(supabase, table) {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select("*").range(from, to);
    if (error) throw new Error(`${table}: ${error.message}`);
    const chunk = Array.isArray(data) ? data : [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function main() {
  const outDirArg = getArg("out", null);
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultOut = path.resolve(scriptDir, "../../documentation/Struktura/slowniki");
  const outDir = path.resolve(process.cwd(), outDirArg ?? defaultOut);

  // Best-effort load local DEV env file (not committed).
  // We intentionally do not print any secrets to stdout.
  await loadDotEnvIfPresent(path.resolve(process.cwd(), ".env.local.off"));

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. " +
        "Run with env loaded (e.g. from .env.local.off) and never expose the key to frontend."
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = [
    // “UI dictionaries” and lookups
    "regions",
    "categories",
    "leagues",
    "clubs",
    "position_dictionary",
    "formations",
    "tactical_slots",
    // legacy positions (still referenced by some migrations/criteria seeds)
    "positions",
    "evaluation_criteria",
    // form templates (senior positional form)
    "position_form_template",
    "position_form_template_element",
    // dict_*
    "dict_preferred_foot",
    "dict_player_sources",
    "dict_recruitment_decisions",
    "dict_team_roles",
    "dict_body_build",
    "dict_strengths",
    "dict_weaknesses",
  ];

  await ensureDir(outDir);

  const manifest = {
    generated_at: new Date().toISOString(),
    supabase_url: url,
    tables,
    files: [],
  };

  for (const t of tables) {
    // eslint-disable-next-line no-console
    console.log(`Exporting ${t}...`);
    const rows = await fetchAll(supabase, t);
    const jsonName = `${t}.json`;
    const csvName = `${t}.csv`;

    await fs.writeFile(path.join(outDir, jsonName), JSON.stringify(rows, null, 2), "utf8");
    await fs.writeFile(path.join(outDir, csvName), toCsv(rows), "utf8");

    manifest.files.push({ table: t, rows: rows.length, json: jsonName, csv: csvName });
  }

  await fs.writeFile(path.join(outDir, "_manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  // eslint-disable-next-line no-console
  console.log(`Done. Wrote exports to: ${outDir}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err?.stack || String(err));
  process.exit(1);
});

