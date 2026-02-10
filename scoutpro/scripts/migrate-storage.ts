import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const DEV_SUPABASE_URL = process.env.DEV_SUPABASE_URL;
const DEV_SUPABASE_SERVICE_ROLE_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;
const PROD_SUPABASE_URL = process.env.PROD_SUPABASE_URL;
const PROD_SUPABASE_SERVICE_ROLE_KEY = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.STORAGE_BUCKET ?? "player-photos";
const UPSERT = process.env.STORAGE_UPSERT === "true";

if (!DEV_SUPABASE_URL || !DEV_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing DEV_SUPABASE_URL or DEV_SUPABASE_SERVICE_ROLE_KEY.");
}
if (!PROD_SUPABASE_URL || !PROD_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing PROD_SUPABASE_URL or PROD_SUPABASE_SERVICE_ROLE_KEY.");
}

const devClient = createClient(DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prodClient = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type StorageItem = {
  name: string;
  id?: string | null;
  metadata?: Record<string, unknown> | null;
};

async function listFiles(prefix = "") {
  const files: string[] = [];
  const stack: string[] = [prefix];

  while (stack.length > 0) {
    const current = stack.pop() ?? "";
    const { data, error } = await devClient.storage.from(BUCKET).list(current, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data) continue;

    for (const item of data as StorageItem[]) {
      const itemPath = current ? `${current}/${item.name}` : item.name;
      const isFolder = !item.id && !item.metadata;
      if (isFolder) {
        stack.push(itemPath);
      } else {
        files.push(itemPath);
      }
    }
  }

  return files;
}

async function copyFile(path: string) {
  const { data, error } = await devClient.storage.from(BUCKET).download(path);
  if (error) throw error;
  if (!data) throw new Error(`No data returned for ${path}`);

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await prodClient.storage.from(BUCKET).upload(path, buffer, {
    upsert: UPSERT,
    contentType: (data as Blob).type || undefined,
  });

  if (uploadError) {
    if (uploadError.status === 409 && !UPSERT) {
      return { skipped: true };
    }
    throw uploadError;
  }

  return { uploaded: true };
}

async function run() {
  const files = await listFiles();
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filePath of files) {
    try {
      const result = await copyFile(filePath);
      if (result.uploaded) uploaded += 1;
      if (result.skipped) skipped += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed to copy ${filePath}:`, error);
    }
  }

  console.log("Storage migration completed.");
  console.log({ bucket: BUCKET, total: files.length, uploaded, skipped, failed, upsert: UPSERT });
}

run().catch((error) => {
  console.error("Storage migration failed:", error);
  process.exit(1);
});
