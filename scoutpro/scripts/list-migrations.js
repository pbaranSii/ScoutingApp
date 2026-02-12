/**
 * Lists migration files in execution order (for comparison with PROD).
 * Run from scoutpro directory: node scripts/list-migrations.js
 */
import fs from "fs";
import path from "path";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
if (!fs.existsSync(migrationsDir)) {
  console.error("Directory supabase/migrations not found. Run from scoutpro.");
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log("Migrations (compare with PROD migration list):");
files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
console.log(`\nTotal: ${files.length} migration(s).`);
