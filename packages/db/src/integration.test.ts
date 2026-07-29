import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { expect, test } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const integrationTest = databaseUrl ? test : test.skip;
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

integrationTest(
  "migrations are repeatable and ownership/audit constraints are enforced",
  async () => {
    const sql = postgres(databaseUrl!, { max: 1, prepare: false });
    const database = drizzle(sql);

    try {
      await migrate(database, { migrationsFolder });
      await migrate(database, { migrationsFolder });

      const suffix = crypto.randomUUID();
      const ownerA = `test-owner-a-${suffix}`;
      const ownerB = `test-owner-b-${suffix}`;
      const projectId = crypto.randomUUID();
      const auditId = crypto.randomUUID();
      const submissionToken = crypto.randomUUID();

      await sql`
        insert into "user" ("id", "name", "email", "email_verified", "created_at", "updated_at")
        values
          (${ownerA}, 'Test Owner A', ${`owner-a-${suffix}@example.test`}, false, now(), now()),
          (${ownerB}, 'Test Owner B', ${`owner-b-${suffix}@example.test`}, false, now(), now())
      `;

      await sql`
        insert into "projects" (
          "id", "owner_user_id", "submission_token", "code", "name",
          "site_name", "location_text", "project_type"
        )
        values (
          ${projectId}, ${ownerA}, ${submissionToken}, ${`T-${suffix.slice(0, 12)}`},
          'Constraint test', 'Test site', 'Test location', 'RENOVATION'
        )
      `;

      await expect(
        sql`
          insert into "projects" (
            "owner_user_id", "submission_token", "code", "name",
            "site_name", "location_text", "project_type"
          )
          values (
            ${ownerA}, ${submissionToken}, ${`D-${suffix.slice(0, 12)}`},
            'Duplicate submission', 'Test site', 'Test location', 'RENOVATION'
          )
        `,
      ).rejects.toThrow();

      await sql`
        insert into "audit_events" (
          "id", "owner_user_id", "project_id", "actor_user_id",
          "event_type", "entity_type", "entity_id"
        )
        values (
          ${auditId}, ${ownerA}, ${projectId}, ${ownerA},
          'project.created', 'project', ${projectId}
        )
      `;

      await expect(
        sql`
          insert into "audit_events" (
            "owner_user_id", "project_id", "actor_user_id",
            "event_type", "entity_type", "entity_id"
          )
          values (
            ${ownerB}, ${projectId}, ${ownerB},
            'project.viewed', 'project', ${projectId}
          )
        `,
      ).rejects.toThrow();

      await expect(
        sql`update "audit_events" set "event_type" = 'changed' where "id" = ${auditId}`,
      ).rejects.toThrow(/append-only/);
    } finally {
      await sql.end();
    }
  },
  30_000,
);
