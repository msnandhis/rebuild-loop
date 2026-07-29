import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";

type SqlClient = ReturnType<typeof postgres>;

const globalDatabase = globalThis as typeof globalThis & {
  rebuildDatabase?: ReturnType<typeof drizzle<typeof schema>>;
  rebuildSqlClient?: SqlClient;
};

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  return databaseUrl;
}

export function getSqlClient(): SqlClient {
  if (globalDatabase.rebuildSqlClient) {
    return globalDatabase.rebuildSqlClient;
  }

  const client = postgres(requireDatabaseUrl(), {
    connect_timeout: 5,
    idle_timeout: 20,
    max: 5,
    prepare: false,
  });

  globalDatabase.rebuildSqlClient = client;
  return client;
}

export function getDatabase() {
  if (globalDatabase.rebuildDatabase) {
    return globalDatabase.rebuildDatabase;
  }

  const database = drizzle(getSqlClient(), { schema });
  globalDatabase.rebuildDatabase = database;
  return database;
}

export async function pingDatabase(): Promise<void> {
  await getSqlClient()`select 1 as healthy`;
}
