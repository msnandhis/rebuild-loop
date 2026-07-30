import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { analysisRuns, workflowJobs } from "./analysis.js";
import { projects } from "./projects.js";

export const jobRunStatus = pgEnum("job_run_status", [
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    workflowJobId: uuid("workflow_job_id").notNull(),
    analysisRunId: uuid("analysis_run_id"),
    attemptNumber: integer("attempt_number").notNull(),
    status: jobRunStatus("status").default("RUNNING").notNull(),
    correlationId: uuid("correlation_id").defaultRandom().notNull(),
    safeErrorCode: varchar("safe_error_code", { length: 80 }),
    safeErrorMessage: varchar("safe_error_message", { length: 400 }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "job_runs_project_owner_fk",
      columns: [table.projectId, table.ownerUserId],
      foreignColumns: [projects.id, projects.ownerUserId],
    }).onDelete("restrict"),
    foreignKey({
      name: "job_runs_workflow_job_fk",
      columns: [table.workflowJobId],
      foreignColumns: [workflowJobs.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "job_runs_analysis_owner_fk",
      columns: [table.analysisRunId, table.projectId, table.ownerUserId],
      foreignColumns: [
        analysisRuns.id,
        analysisRuns.projectId,
        analysisRuns.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("job_runs_job_attempt_unique").on(
      table.workflowJobId,
      table.attemptNumber,
    ),
    index("job_runs_project_started_idx").on(
      table.ownerUserId,
      table.projectId,
      table.startedAt,
    ),
    check("job_runs_attempt_positive", sql`${table.attemptNumber} > 0`),
  ],
);

export const apiIdempotency = pgTable(
  "api_idempotency",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    route: varchar("route", { length: 240 }).notNull(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    responseStatus: integer("response_status"),
    responseBody: jsonb("response_body"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("api_idempotency_owner_route_key_unique").on(
      table.ownerUserId,
      table.route,
      table.idempotencyKey,
    ),
    check(
      "api_idempotency_values",
      sql`${table.requestHash} ~ '^[0-9a-f]{64}$'
        and (${table.responseStatus} is null or ${table.responseStatus} between 100 and 599)
        and (
          (${table.completedAt} is null and ${table.responseStatus} is null)
          or (${table.completedAt} is not null and ${table.responseStatus} is not null and ${table.responseBody} is not null)
        )`,
    ),
  ],
);
