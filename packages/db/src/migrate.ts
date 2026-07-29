import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const sql = postgres(databaseUrl, {
  connect_timeout: 10,
  max: 1,
  prepare: false,
});
const database = drizzle(sql);
let lockAcquired = false;

try {
  await sql`select pg_advisory_lock(7210042620260729)`;
  lockAcquired = true;
  await migrate(database, { migrationsFolder });
} finally {
  if (lockAcquired) {
    await sql`select pg_advisory_unlock(7210042620260729)`;
  }
  await sql.end();
}
