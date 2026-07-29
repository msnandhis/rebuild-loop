import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { projects } from "./projects.js";

export const mediaAssetStatus = pgEnum("media_asset_status", [
  "PENDING_UPLOAD",
  "VERIFYING",
  "READY",
  "REJECTED",
]);

export const uploadSessionStatus = pgEnum("upload_session_status", [
  "OPEN",
  "SUBMITTED",
  "COMPLETED",
  "EXPIRED",
  "REJECTED",
]);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    status: mediaAssetStatus("status").default("PENDING_UPLOAD").notNull(),
    finalObjectKey: text("final_object_key").unique(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    declaredMime: varchar("declared_mime", { length: 100 }).notNull(),
    detectedMime: varchar("detected_mime", { length: 100 }),
    expectedBytes: bigint("expected_bytes", { mode: "number" }).notNull(),
    actualBytes: bigint("actual_bytes", { mode: "number" }),
    sha256: varchar("sha256", { length: 64 }),
    objectVersion: text("object_version"),
    objectEtag: text("object_etag"),
    width: bigint("width", { mode: "number" }),
    height: bigint("height", { mode: "number" }),
    rejectionCode: varchar("rejection_code", { length: 80 }),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "media_assets_project_owner_fk",
      columns: [table.projectId, table.ownerUserId],
      foreignColumns: [projects.id, projects.ownerUserId],
    }).onDelete("restrict"),
    unique("media_assets_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    index("media_assets_project_status_idx").on(
      table.ownerUserId,
      table.projectId,
      table.status,
      table.createdAt,
    ),
    check(
      "media_assets_expected_bytes_range",
      sql`${table.expectedBytes} > 0 and ${table.expectedBytes} <= 10485760`,
    ),
    check(
      "media_assets_actual_bytes_range",
      sql`${table.actualBytes} is null or (${table.actualBytes} > 0 and ${table.actualBytes} <= 10485760)`,
    ),
    check(
      "media_assets_dimensions_positive",
      sql`(${table.width} is null and ${table.height} is null) or (${table.width} > 0 and ${table.height} > 0)`,
    ),
    check(
      "media_assets_ready_fields",
      sql`${table.status} <> 'READY' or (
        ${table.finalObjectKey} is not null
        and ${table.detectedMime} is not null
        and ${table.actualBytes} is not null
        and ${table.sha256} is not null
        and ${table.width} is not null
        and ${table.height} is not null
        and ${table.readyAt} is not null
      )`,
    ),
  ],
);

export const uploadSessions = pgTable(
  "upload_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    incomingObjectKey: text("incoming_object_key").notNull().unique(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    status: uploadSessionStatus("status").default("OPEN").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "upload_sessions_media_owner_fk",
      columns: [table.mediaAssetId, table.projectId, table.ownerUserId],
      foreignColumns: [
        mediaAssets.id,
        mediaAssets.projectId,
        mediaAssets.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("upload_sessions_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    unique("upload_sessions_owner_project_idempotency_unique").on(
      table.ownerUserId,
      table.projectId,
      table.idempotencyKey,
    ),
    index("upload_sessions_expiry_status_idx").on(
      table.status,
      table.expiresAt,
    ),
    check(
      "upload_sessions_request_hash_format",
      sql`${table.requestHash} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
export type UploadSession = typeof uploadSessions.$inferSelect;
