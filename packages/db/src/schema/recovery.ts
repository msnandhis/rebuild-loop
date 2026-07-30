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
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { candidateRevisions, candidateThreads } from "./analysis.js";
import { projects } from "./projects.js";

export const reviewDecisionAction = pgEnum("review_decision_action", [
  "CONFIRMED",
  "CORRECTED",
  "REJECTED",
  "EVIDENCE_REQUESTED",
  "SPECIALIST_REVIEW",
]);

export const inventoryItemStatus = pgEnum("inventory_item_status", [
  "CONFIRMED",
  "REJECTED",
]);

export const recoveryPathway = pgEnum("recovery_pathway", [
  "SAME_SITE_REUSE",
  "DIRECT_REUSE",
  "RECYCLE",
  "SPECIALIST_REVIEW",
  "RESIDUAL",
]);

export const recoveryPlanStatus = pgEnum("recovery_plan_status", [
  "DRAFT",
  "APPROVED",
  "SUPERSEDED",
]);

export const reviewDecisions = pgTable(
  "review_decisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    candidateThreadId: uuid("candidate_thread_id").notNull(),
    candidateRevisionId: uuid("candidate_revision_id").notNull(),
    actorUserId: text("actor_user_id").notNull(),
    action: reviewDecisionAction("action").notNull(),
    reason: varchar("reason", { length: 1000 }),
    editedValues: jsonb("edited_values").default({}).notNull(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "review_decisions_revision_thread_owner_fk",
      columns: [
        table.candidateRevisionId,
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
    unique("review_decisions_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    unique("review_decisions_owner_project_idempotency_unique").on(
      table.ownerUserId,
      table.projectId,
      table.idempotencyKey,
    ),
    index("review_decisions_thread_created_idx").on(
      table.ownerUserId,
      table.projectId,
      table.candidateThreadId,
      table.createdAt,
    ),
    check(
      "review_decisions_actor_owner",
      sql`${table.actorUserId} = ${table.ownerUserId}`,
    ),
    check(
      "review_decisions_request_hash_format",
      sql`${table.requestHash} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    candidateThreadId: uuid("candidate_thread_id").notNull(),
    status: inventoryItemStatus("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "inventory_items_thread_owner_fk",
      columns: [table.candidateThreadId, table.projectId, table.ownerUserId],
      foreignColumns: [
        candidateThreads.id,
        candidateThreads.projectId,
        candidateThreads.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("inventory_items_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    unique("inventory_items_thread_unique").on(table.candidateThreadId),
    index("inventory_items_project_status_idx").on(
      table.ownerUserId,
      table.projectId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const inventoryItemRevisions = pgTable(
  "inventory_item_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    inventoryItemId: uuid("inventory_item_id").notNull(),
    sourceCandidateRevisionId: uuid("source_candidate_revision_id").notNull(),
    sourceDecisionId: uuid("source_decision_id").notNull(),
    revisionNumber: integer("revision_number").notNull(),
    materialFamily: varchar("material_family", { length: 80 }).notNull(),
    subtype: varchar("subtype", { length: 120 }),
    condition: jsonb("condition").notNull(),
    quantity: jsonb("quantity").notNull(),
    safetyFacts: jsonb("safety_facts").default({}).notNull(),
    riskFlags: jsonb("risk_flags").default([]).notNull(),
    specialistReviewRequired: boolean("specialist_review_required")
      .default(false)
      .notNull(),
    humanSnapshot: jsonb("human_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "inventory_revisions_item_owner_fk",
      columns: [table.inventoryItemId, table.projectId, table.ownerUserId],
      foreignColumns: [
        inventoryItems.id,
        inventoryItems.projectId,
        inventoryItems.ownerUserId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "inventory_revisions_candidate_owner_fk",
      columns: [
        table.sourceCandidateRevisionId,
        table.projectId,
        table.ownerUserId,
      ],
      foreignColumns: [
        candidateRevisions.id,
        candidateRevisions.projectId,
        candidateRevisions.ownerUserId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "inventory_revisions_decision_owner_fk",
      columns: [table.sourceDecisionId, table.projectId, table.ownerUserId],
      foreignColumns: [
        reviewDecisions.id,
        reviewDecisions.projectId,
        reviewDecisions.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("inventory_revisions_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    unique("inventory_revisions_item_number_unique").on(
      table.inventoryItemId,
      table.revisionNumber,
    ),
    unique("inventory_revisions_source_decision_unique").on(
      table.sourceDecisionId,
    ),
    index("inventory_revisions_item_created_idx").on(
      table.ownerUserId,
      table.projectId,
      table.inventoryItemId,
      table.createdAt,
    ),
    check(
      "inventory_revisions_number_positive",
      sql`${table.revisionNumber} > 0`,
    ),
  ],
);

export const recoveryRuleVersions = pgTable("recovery_rule_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  version: varchar("version", { length: 80 }).notNull().unique(),
  description: varchar("description", { length: 500 }).notNull(),
  rules: jsonb("rules").notNull(),
  rulesHash: varchar("rules_hash", { length: 64 }).notNull().unique(),
  active: boolean("active").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pathwayAssessments = pgTable(
  "pathway_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    inventoryItemRevisionId: uuid("inventory_item_revision_id").notNull(),
    ruleVersionId: uuid("rule_version_id").notNull(),
    inputHash: varchar("input_hash", { length: 64 }).notNull(),
    inputSnapshot: jsonb("input_snapshot").notNull(),
    firedRuleIds: jsonb("fired_rule_ids").default([]).notNull(),
    failedGates: jsonb("failed_gates").default([]).notNull(),
    passedGates: jsonb("passed_gates").default([]).notNull(),
    preferredPathway: recoveryPathway("preferred_pathway").notNull(),
    alternativePathway: recoveryPathway("alternative_pathway"),
    directReuseBlocked: boolean("direct_reuse_blocked").notNull(),
    explanation: varchar("explanation", { length: 1200 }).notNull(),
    preparationRequirements: jsonb("preparation_requirements")
      .default([])
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "pathway_assessments_inventory_revision_owner_fk",
      columns: [
        table.inventoryItemRevisionId,
        table.projectId,
        table.ownerUserId,
      ],
      foreignColumns: [
        inventoryItemRevisions.id,
        inventoryItemRevisions.projectId,
        inventoryItemRevisions.ownerUserId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "pathway_assessments_rule_version_fk",
      columns: [table.ruleVersionId],
      foreignColumns: [recoveryRuleVersions.id],
    }).onDelete("restrict"),
    unique("pathway_assessments_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    unique("pathway_assessments_input_rule_unique").on(
      table.inventoryItemRevisionId,
      table.ruleVersionId,
      table.inputHash,
    ),
    index("pathway_assessments_project_created_idx").on(
      table.ownerUserId,
      table.projectId,
      table.createdAt,
    ),
    check(
      "pathway_assessments_input_hash_format",
      sql`${table.inputHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "pathway_assessments_direct_reuse_gate",
      sql`not (${table.preferredPathway} in ('DIRECT_REUSE', 'SAME_SITE_REUSE') and ${table.directReuseBlocked})`,
    ),
  ],
);

export const recoveryPlans = pgTable(
  "recovery_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    revisionNumber: integer("revision_number").notNull(),
    sourceHash: varchar("source_hash", { length: 64 }).notNull(),
    status: recoveryPlanStatus("status").default("DRAFT").notNull(),
    approvedByUserId: text("approved_by_user_id"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "recovery_plans_project_owner_fk",
      columns: [table.projectId, table.ownerUserId],
      foreignColumns: [projects.id, projects.ownerUserId],
    }).onDelete("restrict"),
    unique("recovery_plans_id_project_owner_unique").on(
      table.id,
      table.projectId,
      table.ownerUserId,
    ),
    unique("recovery_plans_project_revision_unique").on(
      table.projectId,
      table.revisionNumber,
    ),
    unique("recovery_plans_project_source_hash_unique").on(
      table.projectId,
      table.sourceHash,
    ),
    uniqueIndex("recovery_plans_one_approved_project")
      .on(table.projectId)
      .where(sql`${table.status} = 'APPROVED'`),
    index("recovery_plans_project_status_idx").on(
      table.ownerUserId,
      table.projectId,
      table.status,
      table.createdAt,
    ),
    check(
      "recovery_plans_values",
      sql`${table.revisionNumber} > 0
        and ${table.sourceHash} ~ '^[0-9a-f]{64}$'
        and (
          (${table.status} = 'APPROVED' and ${table.approvedByUserId} = ${table.ownerUserId} and ${table.approvedAt} is not null)
          or (${table.status} <> 'APPROVED')
        )`,
    ),
  ],
);

export const recoveryPlanItems = pgTable(
  "recovery_plan_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    projectId: uuid("project_id").notNull(),
    recoveryPlanId: uuid("recovery_plan_id").notNull(),
    inventoryItemRevisionId: uuid("inventory_item_revision_id").notNull(),
    pathwayAssessmentId: uuid("pathway_assessment_id").notNull(),
    sequence: integer("sequence").notNull(),
    removalInstructions: varchar("removal_instructions", {
      length: 1600,
    }).notNull(),
    risks: jsonb("risks").default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "recovery_plan_items_plan_owner_fk",
      columns: [table.recoveryPlanId, table.projectId, table.ownerUserId],
      foreignColumns: [
        recoveryPlans.id,
        recoveryPlans.projectId,
        recoveryPlans.ownerUserId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "recovery_plan_items_inventory_revision_owner_fk",
      columns: [
        table.inventoryItemRevisionId,
        table.projectId,
        table.ownerUserId,
      ],
      foreignColumns: [
        inventoryItemRevisions.id,
        inventoryItemRevisions.projectId,
        inventoryItemRevisions.ownerUserId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "recovery_plan_items_assessment_owner_fk",
      columns: [table.pathwayAssessmentId, table.projectId, table.ownerUserId],
      foreignColumns: [
        pathwayAssessments.id,
        pathwayAssessments.projectId,
        pathwayAssessments.ownerUserId,
      ],
    }).onDelete("restrict"),
    unique("recovery_plan_items_plan_sequence_unique").on(
      table.recoveryPlanId,
      table.sequence,
    ),
    unique("recovery_plan_items_plan_inventory_unique").on(
      table.recoveryPlanId,
      table.inventoryItemRevisionId,
    ),
    check("recovery_plan_items_sequence_positive", sql`${table.sequence} > 0`),
  ],
);

export type ReviewDecision = typeof reviewDecisions.$inferSelect;
export type InventoryItemRevision = typeof inventoryItemRevisions.$inferSelect;
export type PathwayAssessment = typeof pathwayAssessments.$inferSelect;
export type RecoveryPlan = typeof recoveryPlans.$inferSelect;
