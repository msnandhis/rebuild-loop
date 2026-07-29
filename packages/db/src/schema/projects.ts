import { sql } from "drizzle-orm";
import {
  check,
  date,
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

import { user } from "./auth.js";

export const projectType = pgEnum("project_type", [
  "RENOVATION",
  "DEMOLITION",
  "MIXED",
]);

export const projectStatus = pgEnum("project_status", [
  "DRAFT",
  "INTAKE_READY",
  "ANALYSING",
  "REVIEW_REQUIRED",
  "INVENTORY_CONFIRMED",
  "PLAN_DRAFTED",
  "APPROVED",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    submissionToken: uuid("submission_token").notNull(),
    code: varchar("code", { length: 24 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    siteName: varchar("site_name", { length: 120 }).notNull(),
    locationText: varchar("location_text", { length: 240 }).notNull(),
    type: projectType("project_type").notNull(),
    plannedWorkDate: date("planned_work_date"),
    scaleNote: varchar("scale_note", { length: 240 }),
    status: projectStatus("status").default("DRAFT").notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("projects_id_owner_unique").on(table.id, table.ownerUserId),
    unique("projects_owner_code_unique").on(table.ownerUserId, table.code),
    unique("projects_owner_submission_unique").on(
      table.ownerUserId,
      table.submissionToken,
    ),
    index("projects_owner_updated_idx").on(table.ownerUserId, table.updatedAt),
    index("projects_owner_status_idx").on(table.ownerUserId, table.status),
    check("projects_version_positive", sql`${table.version} > 0`),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    projectId: uuid("project_id"),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "restrict",
    }),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: text("entity_id").notNull(),
    correlationId: uuid("correlation_id").defaultRandom().notNull(),
    payload: jsonb("payload").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "audit_events_project_owner_fk",
      columns: [table.projectId, table.ownerUserId],
      foreignColumns: [projects.id, projects.ownerUserId],
    }).onDelete("restrict"),
    index("audit_events_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
    index("audit_events_owner_created_idx").on(
      table.ownerUserId,
      table.createdAt,
    ),
    check(
      "audit_events_actor_is_owner",
      sql`${table.actorUserId} is null or ${table.actorUserId} = ${table.ownerUserId}`,
    ),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
