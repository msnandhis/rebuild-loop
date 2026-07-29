import "server-only";

import postgres from "postgres";

type DatabaseClient = ReturnType<typeof postgres>;

const globalDatabase = globalThis as typeof globalThis & {
  rebuildDatabase?: DatabaseClient;
};

export function getDatabase(): DatabaseClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const existing = globalDatabase.rebuildDatabase;
  if (existing) {
    return existing;
  }

  const client = postgres(databaseUrl, {
    connect_timeout: 5,
    idle_timeout: 20,
    max: 5,
    prepare: false,
  });

  globalDatabase.rebuildDatabase = client;

  return client;
}

export async function pingDatabase(): Promise<void> {
  const database = getDatabase();
  await database`select 1 as healthy`;
}
