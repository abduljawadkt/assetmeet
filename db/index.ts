import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// One connection pool per server process, reused across requests and hot reloads.
const globalForDb = globalThis as unknown as { assetmeetSql?: ReturnType<typeof postgres> };

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add the Supabase connection string to the hosting environment.");
  // prepare: false is required by Supabase's transaction pooler (port 6543).
  globalForDb.assetmeetSql ??= postgres(url, { prepare: false, max: 5 });
  return drizzle(globalForDb.assetmeetSql, { schema });
}
