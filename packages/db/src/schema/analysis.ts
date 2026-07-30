import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { mediaAssets } from "./evidence.js";
import { projects } from "./projects.js";

export const analysisKind = pgEnum("analysis_kind", [
  "INITIAL",
  "CLARIFICATION",
]);

export const analysisStatus = pgEnum("analysis_status", [
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);

export const analysisPhase = pgEnum("analysis_phase", [
  "QUEUED",
  "PREPARING_EVIDENCE",
  "CALLING_MODEL",
  "VALIDATING",
  "PERSISTING",
  "COMPLETE",
  "FAILED",
]);

export const analysisAttemptStatus = pgEnum("analysis_attempt_status", [
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);

export const modelOutputValidationStatus = pgEnum(
  "model_output_validation_status",
  ["VALID", "SHAPE_INVALID", "SEMANTIC_INVALID"],
);

export const candidateRevisionDisposition = pgEnum(
  "candidate_revision_disposition",
  ["PROPOSED", "REVISED", "UNCHANGED", "WITHDRAWN"],
);

export const materialFamily = pgEnum("material_family", [
  "CONCRETE",
  "BRICK",
  "STEEL",
  "TIMBER",
  "GLASS",
  "ALUMINIUM",
  "FIXTURES",
  "OTHER",
]);

export const preliminaryPathway = pgEnum("preliminary_pathway", [
  "SAME_SITE_REUSE",
  "DIRECT_REUSE",
  "RECYCLE",
  "SPECIALIST_REVIEW",
  "RESIDUAL",
  "UNKNOWN",
]);

export const evidenceLocatorKind = pgEnum("evidence_locator_kind", [
  "FULL_IMAGE",
  "REGION",
]);

export const clarificationEvidenceType = pgEnum("clarification_evidence_type", [
  "CLOSE_UP",
  "LABEL",
  "MEASUREMENT",
  "CONTEXT",
]);

export const clarificationTaskStatus = pgEnum("clarification_task_status", [
  "OPEN",
  "SUBMITTED",
  "ACCEPTED",
  "CANCELLED",
]);

export const workflowJobStatus = pgEnum("workflow_job_status", [
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
]);

export const workflowJobs = pgTable(
  "workflow_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    task: varchar("task", { length: 80 }).notNull(),
    payload: jsonb("payload").notNull(),
    jobKey: varchar("job_key", { length: 160 }).notNull().unique(),
    status: workflowJobStatus("status").default("QUEUED").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    runAt: timestamp("run_at", { withTimezone: true }).defaultNow().notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lastErrorCode: varchar("last_error_code", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("workflow_jobs_claim_idx").on(
      table.status,
      table.runAt,
      table.createdAt,
    ),
    check(
      "workflow_jobs_attempts_valid",
      sql`${table.attempts} >= 0 and ${table.maxAttempts} between 1 and 10`,
    ),
  ],
);

export const analysisRuns = pgTable(
  "analysis_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    kind: analysisKind("kind").default("INITIAL").notNull(),
    baseRunId: uuid("base_run_id"),
    clarificationTaskId: uuid("clarification_task_id"),
    status: analysisStatus("status").default("QUEUED").notNull(),
    phase: analysisPhase("phase").default("QUEUED").notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    promptVersion: varchar("prompt_version", { length: 80 }).notNull(),
    schemaVersion: varchar("schema_version", { length: 80 }).notNull(),
    inputHash: varchar("input_hash", { length: 64 }).notNull(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    safeErrorCode: varchar("safe_error_code", { length: 80 }),
    safeErrorMessage: varchar("safe_error_message", { length: 400 }),
    retryable: boolean("retryable").default(false).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
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
      name: "analysis_runs_project_owner_fk",
      columns: [table.projectId, table.ownerUserId],
      foreignColumns: [projects.id, projects.ownerUserId],
    }).onDelete("restrict"),
    foreignKey({
      name: "analysis_runs_base_run_owner_fk",
      columns: [table.baseRunId, table.projectId, table.ownerUserId],
      foreignColumns: [table.id, table.projectId, table.ownerUserId],
    }).onDelete("restrict"),
    unique("analysis_runs_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    unique("analysis_runs_owner_project_idempotency_unique").on(
      table.ownerUserId,
      table.projectId,
      table.idempotencyKey,
    ),
    uniqueIndex("analysis_runs_one_active_per_project")
      .on(table.ownerUserId, table.projectId)
      .where(sql`${table.status} in ('QUEUED', 'RUNNING')`),
    index("analysis_runs_clarification_task_idx")
      .on(table.ownerUserId, table.projectId, table.clarificationTaskId)
      .where(sql`${table.clarificationTaskId} is not null`),
    index("analysis_runs_project_created_idx").on(
      table.ownerUserId,
      table.projectId,
      table.createdAt,
    ),
    index("analysis_runs_input_hash_idx").on(
      table.ownerUserId,
      table.projectId,
      table.inputHash,
    ),
    check(
      "analysis_runs_hash_formats",
      sql`${table.inputHash} ~ '^[0-9a-f]{64}$' and ${table.requestHash} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const analysisInputs = pgTable(
  "analysis_inputs",
  {
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    analysisRunId: uuid("analysis_run_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    purpose: varchar("purpose", { length: 80 }).default("PRIMARY").notNull(),
    sha256Snapshot: varchar("sha256_snapshot", { length: 64 }).notNull(),
    bytesSnapshot: integer("bytes_snapshot").notNull(),
    mimeSnapshot: varchar("mime_snapshot", { length: 100 }).notNull(),
    widthSnapshot: integer("width_snapshot").notNull(),
    heightSnapshot: integer("height_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "analysis_inputs_pk",
      columns: [table.analysisRunId, table.mediaAssetId],
    }),
    foreignKey({
      name: "analysis_inputs_run_owner_fk",
      columns: [table.analysisRunId, table.projectId, table.ownerUserId],
      foreignColumns: [
        analysisRuns.id,
        analysisRuns.projectId,
        analysisRuns.ownerUserId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "analysis_inputs_media_owner_fk",
      columns: [table.mediaAssetId, table.projectId, table.ownerUserId],
      foreignColumns: [
        mediaAssets.id,
        mediaAssets.projectId,
        mediaAssets.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("analysis_inputs_run_media_owner_unique").on(
      table.analysisRunId,
      table.mediaAssetId,
      table.ownerUserId,
      table.projectId,
    ),
    unique("analysis_inputs_run_ordinal_unique").on(
      table.analysisRunId,
      table.ordinal,
    ),
    check(
      "analysis_inputs_snapshot_values",
      sql`${table.sha256Snapshot} ~ '^[0-9a-f]{64}$'
        and ${table.bytesSnapshot} > 0
        and ${table.widthSnapshot} > 0
        and ${table.heightSnapshot} > 0
        and ${table.ordinal} >= 0`,
    ),
  ],
);

export const analysisAttempts = pgTable(
  "analysis_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    analysisRunId: uuid("analysis_run_id").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    queueJobId: text("queue_job_id"),
    status: analysisAttemptStatus("status").default("RUNNING").notNull(),
    providerRequestId: text("provider_request_id"),
    safeErrorCode: varchar("safe_error_code", { length: 80 }),
    safeErrorMessage: varchar("safe_error_message", { length: 400 }),
    latencyMs: integer("latency_ms"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "analysis_attempts_run_owner_fk",
      columns: [table.analysisRunId, table.projectId, table.ownerUserId],
      foreignColumns: [
        analysisRuns.id,
        analysisRuns.projectId,
        analysisRuns.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("analysis_attempts_id_run_owner_unique").on(
      table.id,
      table.analysisRunId,
      table.ownerUserId,
      table.projectId,
    ),
    unique("analysis_attempts_run_number_unique").on(
      table.analysisRunId,
      table.attemptNumber,
    ),
    check(
      "analysis_attempts_values",
      sql`${table.attemptNumber} > 0 and (${table.latencyMs} is null or ${table.latencyMs} >= 0)`,
    ),
  ],
);

export const modelOutputs = pgTable(
  "model_outputs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    analysisRunId: uuid("analysis_run_id").notNull(),
    analysisAttemptId: uuid("analysis_attempt_id").notNull(),
    providerEnvelope: jsonb("provider_envelope").notNull(),
    extractedRawText: text("extracted_raw_text"),
    normalizedOutput: jsonb("normalized_output"),
    responseHash: varchar("response_hash", { length: 64 }).notNull(),
    validationStatus:
      modelOutputValidationStatus("validation_status").notNull(),
    usage: jsonb("usage").default({}).notNull(),
    finishReason: varchar("finish_reason", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "model_outputs_attempt_owner_fk",
      columns: [
        table.analysisAttemptId,
        table.analysisRunId,
        table.ownerUserId,
        table.projectId,
      ],
      foreignColumns: [
        analysisAttempts.id,
        analysisAttempts.analysisRunId,
        analysisAttempts.ownerUserId,
        analysisAttempts.projectId,
      ],
    }).onDelete("restrict"),
    unique("model_outputs_id_run_owner_unique").on(
      table.id,
      table.analysisRunId,
      table.ownerUserId,
      table.projectId,
    ),
    unique("model_outputs_attempt_unique").on(table.analysisAttemptId),
    check(
      "model_outputs_response_hash_format",
      sql`${table.responseHash} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const candidateThreads = pgTable(
  "candidate_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    createdFromRunId: uuid("created_from_run_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "candidate_threads_run_owner_fk",
      columns: [table.createdFromRunId, table.projectId, table.ownerUserId],
      foreignColumns: [
        analysisRuns.id,
        analysisRuns.projectId,
        analysisRuns.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("candidate_threads_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    index("candidate_threads_project_created_idx").on(
      table.ownerUserId,
      table.projectId,
      table.createdAt,
    ),
  ],
);

export const candidateRevisions = pgTable(
  "candidate_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    candidateThreadId: uuid("candidate_thread_id").notNull(),
    analysisRunId: uuid("analysis_run_id").notNull(),
    modelOutputId: uuid("model_output_id").notNull(),
    revisionNumber: integer("revision_number").notNull(),
    previousRevisionId: uuid("previous_revision_id"),
    disposition: candidateRevisionDisposition("disposition").notNull(),
    clientCandidateKey: varchar("client_candidate_key", {
      length: 64,
    }).notNull(),
    materialFamily: materialFamily("material_family").notNull(),
    subtype: varchar("subtype", { length: 120 }),
    observationSummary: text("observation_summary").notNull(),
    condition: jsonb("condition").notNull(),
    quantity: jsonb("quantity").notNull(),
    unknowns: jsonb("unknowns").default([]).notNull(),
    riskFlags: jsonb("risk_flags").default([]).notNull(),
    specialistReviewRequired: boolean("specialist_review_required")
      .default(false)
      .notNull(),
    preliminaryPathway: preliminaryPathway("preliminary_pathway").notNull(),
    overallConfidence: real("overall_confidence").notNull(),
    normalizedSnapshot: jsonb("normalized_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "candidate_revisions_thread_owner_fk",
      columns: [table.candidateThreadId, table.projectId, table.ownerUserId],
      foreignColumns: [
        candidateThreads.id,
        candidateThreads.projectId,
        candidateThreads.ownerUserId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "candidate_revisions_output_owner_fk",
      columns: [
        table.modelOutputId,
        table.analysisRunId,
        table.ownerUserId,
        table.projectId,
      ],
      foreignColumns: [
        modelOutputs.id,
        modelOutputs.analysisRunId,
        modelOutputs.ownerUserId,
        modelOutputs.projectId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "candidate_revisions_previous_owner_fk",
      columns: [
        table.previousRevisionId,
        table.candidateThreadId,
        table.ownerUserId,
        table.projectId,
      ],
      foreignColumns: [
        table.id,
        table.candidateThreadId,
        table.ownerUserId,
        table.projectId,
      ],
    }).onDelete("restrict"),
    unique("candidate_revisions_id_thread_owner_unique").on(
      table.id,
      table.candidateThreadId,
      table.ownerUserId,
      table.projectId,
    ),
    unique("candidate_revisions_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    unique("candidate_revisions_id_run_owner_unique").on(
      table.id,
      table.analysisRunId,
      table.ownerUserId,
      table.projectId,
    ),
    unique("candidate_revisions_thread_number_unique").on(
      table.candidateThreadId,
      table.revisionNumber,
    ),
    index("candidate_revisions_current_lookup_idx").on(
      table.candidateThreadId,
      table.revisionNumber,
    ),
    check(
      "candidate_revisions_values",
      sql`${table.revisionNumber} > 0
        and ${table.overallConfidence} >= 0
        and ${table.overallConfidence} <= 1
      `,
    ),
  ],
);

export const evidenceReferences = pgTable(
  "evidence_references",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    candidateRevisionId: uuid("candidate_revision_id").notNull(),
    analysisRunId: uuid("analysis_run_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    locatorKind: evidenceLocatorKind("locator_kind").notNull(),
    locator: jsonb("locator").default({}).notNull(),
    observation: varchar("observation", { length: 400 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "evidence_references_revision_run_owner_fk",
      columns: [
        table.candidateRevisionId,
        table.analysisRunId,
        table.ownerUserId,
        table.projectId,
      ],
      foreignColumns: [
        candidateRevisions.id,
        candidateRevisions.analysisRunId,
        candidateRevisions.ownerUserId,
        candidateRevisions.projectId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "evidence_references_input_owner_fk",
      columns: [
        table.analysisRunId,
        table.mediaAssetId,
        table.ownerUserId,
        table.projectId,
      ],
      foreignColumns: [
        analysisInputs.analysisRunId,
        analysisInputs.mediaAssetId,
        analysisInputs.ownerUserId,
        analysisInputs.projectId,
      ],
    }).onDelete("restrict"),
    unique("evidence_references_revision_ordinal_unique").on(
      table.candidateRevisionId,
      table.ordinal,
    ),
    index("evidence_references_media_idx").on(
      table.ownerUserId,
      table.projectId,
      table.mediaAssetId,
    ),
    check(
      "evidence_references_ordinal_nonnegative",
      sql`${table.ordinal} >= 0`,
    ),
  ],
);

export const clarificationTasks = pgTable(
  "clarification_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    candidateThreadId: uuid("candidate_thread_id").notNull(),
    sourceRevisionId: uuid("source_revision_id").notNull(),
    instruction: varchar("instruction", { length: 500 }).notNull(),
    rationale: varchar("rationale", { length: 500 }).notNull(),
    requiredEvidence: clarificationEvidenceType("required_evidence").notNull(),
    status: clarificationTaskStatus("status").default("OPEN").notNull(),
    resolvingRevisionId: uuid("resolving_revision_id"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "clarification_tasks_revision_thread_owner_fk",
      columns: [
        table.sourceRevisionId,
        table.candidateThreadId,
        table.ownerUserId,
        table.projectId,
      ],
      foreignColumns: [
        candidateRevisions.id,
        candidateRevisions.candidateThreadId,
        candidateRevisions.ownerUserId,
        candidateRevisions.projectId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "clarification_tasks_resolving_revision_thread_owner_fk",
      columns: [
        table.resolvingRevisionId,
        table.candidateThreadId,
        table.ownerUserId,
        table.projectId,
      ],
      foreignColumns: [
        candidateRevisions.id,
        candidateRevisions.candidateThreadId,
        candidateRevisions.ownerUserId,
        candidateRevisions.projectId,
      ],
    }).onDelete("restrict"),
    unique("clarification_tasks_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    index("clarification_tasks_project_status_idx").on(
      table.ownerUserId,
      table.projectId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const clarificationSubmissions = pgTable(
  "clarification_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    clarificationTaskId: uuid("clarification_task_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    submittedByUserId: text("submitted_by_user_id").notNull(),
    note: varchar("note", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "clarification_submissions_task_owner_fk",
      columns: [table.clarificationTaskId, table.projectId, table.ownerUserId],
      foreignColumns: [
        clarificationTasks.id,
        clarificationTasks.projectId,
        clarificationTasks.ownerUserId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "clarification_submissions_media_owner_fk",
      columns: [table.mediaAssetId, table.projectId, table.ownerUserId],
      foreignColumns: [
        mediaAssets.id,
        mediaAssets.projectId,
        mediaAssets.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("clarification_submissions_task_media_unique").on(
      table.clarificationTaskId,
      table.mediaAssetId,
    ),
    index("clarification_submissions_task_created_idx").on(
      table.ownerUserId,
      table.projectId,
      table.clarificationTaskId,
      table.createdAt,
    ),
    check(
      "clarification_submissions_actor_owner",
      sql`${table.submittedByUserId} = ${table.ownerUserId}`,
    ),
  ],
);

export type AnalysisRun = typeof analysisRuns.$inferSelect;
export type CandidateRevision = typeof candidateRevisions.$inferSelect;
