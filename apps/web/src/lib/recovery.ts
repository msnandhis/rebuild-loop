import "server-only";

import { getSqlClient } from "@rebuild/db";
import { createHash } from "node:crypto";

import { assessRecoveryPathway, type RecoveryPathway } from "./recovery-rules";

export type { RecoveryPathway } from "./recovery-rules";

export interface QuantitySnapshot {
  basis?: string;
  max?: number;
  min?: number;
  unit?: string;
}

export interface ConditionSnapshot {
  confidence?: number;
  value?: string;
}

export interface MaterialLedgerItem {
  candidateRevisionId: string;
  candidateThreadId: string;
  condition: ConditionSnapshot;
  confirmedAt: Date;
  id: string;
  lane: "RECOVERY" | "RUBBLE";
  lotCode: string;
  materialFamily: string;
  quantity: QuantitySnapshot;
  revisionId: string;
  revisionNumber: number;
  riskFlags: string[];
  specialistReviewRequired: boolean;
  subtype: string | null;
  unknowns: string[];
}

interface InventoryRow {
  candidate_revision_id: string;
  candidate_thread_id: string;
  condition: unknown;
  confirmed_at: Date | string;
  human_snapshot: unknown;
  id: string;
  material_family: string;
  quantity: unknown;
  revision_id: string;
  revision_number: number;
  risk_flags: unknown;
  safety_facts: unknown;
  specialist_review_required: boolean;
  subtype: string | null;
  unknowns: unknown;
}

interface PathwayRow {
  alternative_pathway: RecoveryPathway | null;
  assessed_at: Date | string;
  explanation: string;
  failed_gates: unknown;
  id: string;
  inventory_revision_id: string;
  lot_code: string;
  material_family: string;
  passed_gates: unknown;
  preferred_pathway: RecoveryPathway;
  preparation_requirements: unknown;
  rule_version: string;
  subtype: string | null;
}

interface PlanRow {
  approved_at: Date | string | null;
  approved_by: string | null;
  created_at: Date | string;
  id: string;
  revision_number: number;
  source_hash: string;
  status: "APPROVED" | "DRAFT" | "SUPERSEDED";
}

interface PlanItemRow {
  id: string;
  lot_code: string;
  material_family: string;
  pathway: RecoveryPathway;
  removal_instructions: string;
  risks: unknown;
  sequence: number;
  subtype: string | null;
}

export interface PathwayGate {
  code: string;
  label: string;
  reason: string;
  status: "BLOCKED" | "PASSED";
}

export interface PathwaySheet {
  alternativePathway: RecoveryPathway | null;
  assessedAt: Date;
  explanation: string;
  gates: PathwayGate[];
  id: string;
  inventoryRevisionId: string;
  lotCode: string;
  materialFamily: string;
  preferredPathway: RecoveryPathway;
  preparationRequirements: string[];
  ruleVersion: string;
  subtype: string | null;
}

export interface RecoveryPlanItem {
  id: string;
  instructions: string[];
  lotCode: string;
  materialFamily: string;
  pathway: RecoveryPathway;
  risks: string[];
  sequence: number;
  subtype: string | null;
}

export interface RecoveryPlanView {
  approvedAt: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  id: string;
  items: RecoveryPlanItem[];
  revisionNumber: number;
  sourceHash: string;
  status: "APPROVED" | "DRAFT" | "SUPERSEDED";
}

export interface AuditTimelineEvent {
  actorLabel: string;
  correlationId: string;
  createdAt: Date;
  entityId: string;
  entityType: string;
  eventType: string;
  id: string;
  payload: Record<string, unknown>;
}

interface AuditRow {
  actor_label: string | null;
  correlation_id: string;
  created_at: Date | string;
  entity_id: string;
  entity_type: string;
  event_type: string;
  id: string;
  payload: unknown;
}

export async function listProjectAuditEvents(
  projectId: string,
  ownerUserId: string,
  limit = 100,
): Promise<AuditTimelineEvent[]> {
  const sql = getSqlClient();
  const rows = await sql<AuditRow[]>`
    select
      ae.id,
      ae.event_type,
      ae.entity_type,
      ae.entity_id,
      ae.correlation_id,
      ae.payload,
      ae.created_at,
      coalesce(u.name, 'ReBuild Loop') as actor_label
    from audit_events ae
    left join "user" u on u.id = ae.actor_user_id
    where ae.project_id = ${projectId}::uuid
      and ae.owner_user_id = ${ownerUserId}
    order by ae.created_at desc
    limit ${Math.min(Math.max(limit, 1), 250)}
  `;

  return rows.map((row) => ({
    actorLabel: row.actor_label ?? "ReBuild Loop",
    correlationId: row.correlation_id,
    createdAt: toDate(row.created_at),
    entityId: row.entity_id,
    entityType: row.entity_type,
    eventType: row.event_type,
    id: row.id,
    payload: toRecord(row.payload),
  }));
}

export async function listConfirmedInventory(
  projectId: string,
  ownerUserId: string,
): Promise<MaterialLedgerItem[]> {
  const sql = getSqlClient();
  const rows = await sql<InventoryRow[]>`
    select distinct on (ii.id)
      ii.id,
      ii.candidate_thread_id,
      iir.id as revision_id,
      iir.source_candidate_revision_id as candidate_revision_id,
      iir.revision_number,
      iir.material_family,
      iir.subtype,
      iir.condition,
      iir.quantity,
      iir.safety_facts,
      iir.risk_flags,
      iir.specialist_review_required,
      iir.human_snapshot,
      cr.unknowns,
      iir.created_at as confirmed_at
    from inventory_items ii
    join inventory_item_revisions iir
      on iir.inventory_item_id = ii.id
      and iir.project_id = ii.project_id
      and iir.owner_user_id = ii.owner_user_id
    join candidate_revisions cr
      on cr.id = iir.source_candidate_revision_id
      and cr.project_id = iir.project_id
      and cr.owner_user_id = iir.owner_user_id
    where ii.project_id = ${projectId}::uuid
      and ii.owner_user_id = ${ownerUserId}
      and ii.status = 'CONFIRMED'
    order by ii.id, iir.revision_number desc
  `;

  return rows.map((row) => ({
    candidateRevisionId: row.candidate_revision_id,
    candidateThreadId: row.candidate_thread_id,
    condition: toCondition(row.condition),
    confirmedAt: toDate(row.confirmed_at),
    id: row.id,
    lane: rubbleFamilies.has(row.material_family) ? "RUBBLE" : "RECOVERY",
    lotCode: lotCode(row.id),
    materialFamily: row.material_family,
    quantity: toQuantity(row.quantity),
    revisionId: row.revision_id,
    revisionNumber: row.revision_number,
    riskFlags: toStringArray(row.risk_flags),
    specialistReviewRequired: row.specialist_review_required,
    subtype: row.subtype,
    unknowns: toStringArray(row.unknowns),
  }));
}

export async function listPathwayAssessments(
  projectId: string,
  ownerUserId: string,
): Promise<PathwaySheet[]> {
  const sql = getSqlClient();
  const rows = await sql<PathwayRow[]>`
    select distinct on (pa.inventory_item_revision_id)
      pa.id,
      pa.inventory_item_revision_id as inventory_revision_id,
      pa.preferred_pathway,
      pa.alternative_pathway,
      pa.failed_gates,
      pa.passed_gates,
      pa.explanation,
      pa.preparation_requirements,
      pa.created_at as assessed_at,
      rrv.version as rule_version,
      iir.material_family,
      iir.subtype,
      'LOT-' || upper(left(ii.id::text, 8)) as lot_code
    from pathway_assessments pa
    join recovery_rule_versions rrv on rrv.id = pa.rule_version_id
    join inventory_item_revisions iir
      on iir.id = pa.inventory_item_revision_id
      and iir.project_id = pa.project_id
      and iir.owner_user_id = pa.owner_user_id
    join inventory_items ii
      on ii.id = iir.inventory_item_id
      and ii.project_id = iir.project_id
      and ii.owner_user_id = iir.owner_user_id
    where pa.project_id = ${projectId}::uuid
      and pa.owner_user_id = ${ownerUserId}
      and ii.status = 'CONFIRMED'
      and iir.revision_number = (
        select max(latest.revision_number)
        from inventory_item_revisions latest
        where latest.inventory_item_id = iir.inventory_item_id
      )
    order by pa.inventory_item_revision_id, pa.created_at desc
  `;

  return rows.map((row) => ({
    alternativePathway: row.alternative_pathway,
    assessedAt: toDate(row.assessed_at),
    explanation: row.explanation,
    gates: [
      ...toGateArray(row.failed_gates, "BLOCKED"),
      ...toGateArray(row.passed_gates, "PASSED"),
    ],
    id: row.id,
    inventoryRevisionId: row.inventory_revision_id,
    lotCode: row.lot_code,
    materialFamily: row.material_family,
    preferredPathway: row.preferred_pathway,
    preparationRequirements: toStringArray(row.preparation_requirements),
    ruleVersion: row.rule_version,
    subtype: row.subtype,
  }));
}

export async function calculatePathways(
  projectId: string,
  ownerUserId: string,
) {
  const sql = getSqlClient();
  const inventory = await sql<InventoryRow[]>`
    select distinct on (ii.id)
      ii.id,
      ii.candidate_thread_id,
      iir.id as revision_id,
      iir.source_candidate_revision_id as candidate_revision_id,
      iir.revision_number,
      iir.material_family,
      iir.subtype,
      iir.condition,
      iir.quantity,
      iir.safety_facts,
      iir.risk_flags,
      iir.specialist_review_required,
      iir.human_snapshot,
      cr.unknowns,
      iir.created_at as confirmed_at
    from inventory_items ii
    join inventory_item_revisions iir
      on iir.inventory_item_id = ii.id
      and iir.project_id = ii.project_id
      and iir.owner_user_id = ii.owner_user_id
    join candidate_revisions cr
      on cr.id = iir.source_candidate_revision_id
      and cr.project_id = iir.project_id
      and cr.owner_user_id = iir.owner_user_id
    where ii.project_id = ${projectId}::uuid
      and ii.owner_user_id = ${ownerUserId}
      and ii.status = 'CONFIRMED'
    order by ii.id, iir.revision_number desc
  `;

  if (!inventory.length) {
    throw new RecoveryValidationError(
      "Confirm at least one material before preparing recommended actions.",
    );
  }

  const rulesHash = sha256(JSON.stringify(RULE_DEFINITION));
  await sql`
    insert into recovery_rule_versions (
      version, description, rules, rules_hash, active
    ) values (
      ${RULE_VERSION},
      ${"Deterministic human-confirmation and safety gates for the hackathon recovery workflow."},
      ${JSON.stringify(RULE_DEFINITION)}::jsonb,
      ${rulesHash},
      true
    )
    on conflict (version) do nothing
  `;
  const [ruleVersion] = await sql<{ id: string; rules_hash: string }[]>`
    select id, rules_hash
    from recovery_rule_versions
    where version = ${RULE_VERSION}
    limit 1
  `;
  if (!ruleVersion) throw new Error("Recovery rule version is unavailable");
  if (ruleVersion.rules_hash !== rulesHash) {
    throw new Error(
      "The stored recovery rule does not match the current rule definition.",
    );
  }

  let blocked = 0;
  for (const row of inventory) {
    const assessment = assessInventory(row);
    if (assessment.directReuseBlocked) blocked += 1;
    const snapshot = {
      condition: row.condition,
      humanSnapshot: row.human_snapshot,
      materialFamily: row.material_family,
      quantity: row.quantity,
      riskFlags: row.risk_flags,
      safetyFacts: row.safety_facts,
      specialistReviewRequired: row.specialist_review_required,
      subtype: row.subtype,
    };
    const inputHash = sha256(canonicalJson(snapshot));

    await sql`
      insert into pathway_assessments (
        owner_user_id,
        project_id,
        inventory_item_revision_id,
        rule_version_id,
        input_hash,
        input_snapshot,
        fired_rule_ids,
        failed_gates,
        passed_gates,
        preferred_pathway,
        alternative_pathway,
        direct_reuse_blocked,
        explanation,
        preparation_requirements
      ) values (
        ${ownerUserId},
        ${projectId}::uuid,
        ${row.revision_id}::uuid,
        ${ruleVersion.id}::uuid,
        ${inputHash},
        ${JSON.stringify(snapshot)}::jsonb,
        ${JSON.stringify(assessment.firedRuleIds)}::jsonb,
        ${JSON.stringify(assessment.failedGates)}::jsonb,
        ${JSON.stringify(assessment.passedGates)}::jsonb,
        ${assessment.preferredPathway},
        ${assessment.alternativePathway},
        ${assessment.directReuseBlocked},
        ${assessment.explanation},
        ${JSON.stringify(assessment.preparationRequirements)}::jsonb
      )
      on conflict (
        inventory_item_revision_id, rule_version_id, input_hash
      ) do nothing
    `;
  }

  await sql`
    insert into audit_events (
      owner_user_id,
      project_id,
      actor_user_id,
      event_type,
      entity_type,
      entity_id,
      payload
    ) values (
      ${ownerUserId},
      ${projectId}::uuid,
      ${ownerUserId},
      'pathways.calculated',
      'project',
      ${projectId},
      ${JSON.stringify({
        assessedCount: inventory.length,
        blockedCount: blocked,
        ruleVersion: RULE_VERSION,
      })}::jsonb
    )
  `;

  return { assessedCount: inventory.length, blockedCount: blocked };
}

export async function findCurrentRecoveryPlan(
  projectId: string,
  ownerUserId: string,
): Promise<RecoveryPlanView | null> {
  const sql = getSqlClient();
  const [plan] = await sql<PlanRow[]>`
    select
      rp.id,
      rp.revision_number,
      rp.source_hash,
      rp.status,
      rp.approved_at,
      rp.created_at,
      u.name as approved_by
    from recovery_plans rp
    left join "user" u on u.id = rp.approved_by_user_id
    where rp.project_id = ${projectId}::uuid
      and rp.owner_user_id = ${ownerUserId}
      and rp.status in ('DRAFT', 'APPROVED')
    order by
      case when rp.status = 'APPROVED' then 0 else 1 end,
      rp.revision_number desc
    limit 1
  `;
  if (!plan) return null;

  const items = await sql<PlanItemRow[]>`
    select
      rpi.id,
      rpi.sequence,
      rpi.removal_instructions,
      rpi.risks,
      iir.material_family,
      iir.subtype,
      pa.preferred_pathway as pathway,
      'LOT-' || upper(left(ii.id::text, 8)) as lot_code
    from recovery_plan_items rpi
    join inventory_item_revisions iir
      on iir.id = rpi.inventory_item_revision_id
      and iir.project_id = rpi.project_id
      and iir.owner_user_id = rpi.owner_user_id
    join inventory_items ii
      on ii.id = iir.inventory_item_id
      and ii.project_id = iir.project_id
      and ii.owner_user_id = iir.owner_user_id
    join pathway_assessments pa
      on pa.id = rpi.pathway_assessment_id
      and pa.project_id = rpi.project_id
      and pa.owner_user_id = rpi.owner_user_id
    where rpi.recovery_plan_id = ${plan.id}::uuid
      and rpi.project_id = ${projectId}::uuid
      and rpi.owner_user_id = ${ownerUserId}
    order by rpi.sequence
  `;

  return {
    approvedAt: plan.approved_at ? toDate(plan.approved_at) : null,
    approvedBy: plan.approved_by,
    createdAt: toDate(plan.created_at),
    id: plan.id,
    items: items.map((item) => ({
      id: item.id,
      instructions: [item.removal_instructions],
      lotCode: item.lot_code,
      materialFamily: item.material_family,
      pathway: item.pathway,
      risks: toStringArray(item.risks),
      sequence: item.sequence,
      subtype: item.subtype,
    })),
    revisionNumber: plan.revision_number,
    sourceHash: plan.source_hash,
    status: plan.status,
  };
}

export async function createRecoveryPlan(
  projectId: string,
  ownerUserId: string,
) {
  const sql = getSqlClient();
  const assessments = await listPathwayAssessments(projectId, ownerUserId);
  const inventory = await listConfirmedInventory(projectId, ownerUserId);
  if (!inventory.length) {
    throw new RecoveryValidationError(
      "Confirm at least one material before preparing the recovery plan.",
    );
  }
  if (assessments.length !== inventory.length) {
    throw new RecoveryValidationError(
      "Prepare a recommended action for every confirmed material before creating the recovery plan.",
    );
  }

  const sourceHash = recoveryPlanSourceHash(assessments);
  const [existing] = await sql<{ id: string }[]>`
    select id
    from recovery_plans
    where project_id = ${projectId}::uuid
      and owner_user_id = ${ownerUserId}
      and source_hash = ${sourceHash}
    limit 1
  `;
  if (existing) return { id: existing.id, reused: true };

  const [revision] = await sql<{ next_revision: number }[]>`
    select coalesce(max(revision_number), 0)::int + 1 as next_revision
    from recovery_plans
    where project_id = ${projectId}::uuid
      and owner_user_id = ${ownerUserId}
  `;
  const nextRevision = revision?.next_revision ?? 1;
  const [plan] = await sql<{ id: string }[]>`
    insert into recovery_plans (
      owner_user_id, project_id, revision_number, source_hash, status
    ) values (
      ${ownerUserId},
      ${projectId}::uuid,
      ${nextRevision},
      ${sourceHash},
      'DRAFT'
    )
    returning id
  `;
  if (!plan) throw new Error("Recovery plan could not be created");

  await sql`
    update recovery_plans
    set status = 'SUPERSEDED', superseded_at = now(), updated_at = now()
    where project_id = ${projectId}::uuid
      and owner_user_id = ${ownerUserId}
      and id <> ${plan.id}::uuid
      and status in ('DRAFT', 'APPROVED')
  `;

  for (const [index, assessment] of assessments.entries()) {
    await sql`
      insert into recovery_plan_items (
        owner_user_id,
        project_id,
        recovery_plan_id,
        inventory_item_revision_id,
        pathway_assessment_id,
        sequence,
        removal_instructions,
        risks
      ) values (
        ${ownerUserId},
        ${projectId}::uuid,
        ${plan.id}::uuid,
        ${assessment.inventoryRevisionId}::uuid,
        ${assessment.id}::uuid,
        ${index + 1},
        ${removalInstruction(assessment)},
        ${JSON.stringify(
          assessment.gates
            .filter((gate) => gate.status === "BLOCKED")
            .map((gate) => gate.reason),
        )}::jsonb
      )
    `;
  }

  await sql`
    update projects
    set status = 'PLAN_DRAFTED', version = version + 1, updated_at = now()
    where id = ${projectId}::uuid and owner_user_id = ${ownerUserId}
  `;
  await sql`
    insert into audit_events (
      owner_user_id, project_id, actor_user_id, event_type,
      entity_type, entity_id, payload
    ) values (
      ${ownerUserId}, ${projectId}::uuid, ${ownerUserId}, 'plan.drafted',
      'recovery_plan', ${plan.id},
      ${JSON.stringify({
        itemCount: assessments.length,
        revisionNumber: nextRevision,
        sourceHash,
      })}::jsonb
    )
  `;

  return { id: plan.id, reused: false };
}

export async function approveRecoveryPlan(
  planId: string,
  projectId: string,
  ownerUserId: string,
) {
  const sql = getSqlClient();
  const [plan] = await sql<{ id: string; status: string }[]>`
    select id, status
    from recovery_plans
    where id = ${planId}::uuid
      and project_id = ${projectId}::uuid
      and owner_user_id = ${ownerUserId}
    limit 1
  `;
  if (!plan) throw new RecoveryNotFoundError("Recovery plan not found.");
  if (plan.status === "APPROVED") return { id: plan.id, approved: true };
  if (plan.status !== "DRAFT") {
    throw new RecoveryConflictError(
      "This plan revision has been superseded. Refresh before approving.",
    );
  }

  await sql`
    update recovery_plans
    set
      status = 'APPROVED',
      approved_by_user_id = ${ownerUserId},
      approved_at = now(),
      updated_at = now()
    where id = ${planId}::uuid
      and project_id = ${projectId}::uuid
      and owner_user_id = ${ownerUserId}
      and status = 'DRAFT'
  `;
  await sql`
    update recovery_plans
    set status = 'SUPERSEDED', superseded_at = now(), updated_at = now()
    where project_id = ${projectId}::uuid
      and owner_user_id = ${ownerUserId}
      and id <> ${planId}::uuid
      and status = 'DRAFT'
  `;
  await sql`
    update projects
    set status = 'APPROVED', version = version + 1, updated_at = now()
    where id = ${projectId}::uuid and owner_user_id = ${ownerUserId}
  `;
  await sql`
    insert into audit_events (
      owner_user_id, project_id, actor_user_id, event_type,
      entity_type, entity_id, payload
    ) values (
      ${ownerUserId}, ${projectId}::uuid, ${ownerUserId}, 'plan.approved',
      'recovery_plan', ${planId},
      ${JSON.stringify({ approvedByUserId: ownerUserId })}::jsonb
    )
  `;
  return { id: plan.id, approved: true };
}

export class RecoveryValidationError extends Error {}
export class RecoveryConflictError extends Error {}
export class RecoveryNotFoundError extends Error {}

export function recoveryPlanSourceHash(
  assessments: Array<Pick<PathwaySheet, "id" | "inventoryRevisionId">>,
) {
  return sha256(
    canonicalJson(
      [...assessments]
        .sort((left, right) =>
          left.inventoryRevisionId.localeCompare(right.inventoryRevisionId),
        )
        .map((item) => ({
          assessmentId: item.id,
          inventoryRevisionId: item.inventoryRevisionId,
        })),
    ),
  );
}

const RULE_VERSION = "RBL-SAFE-2026.1";
const RULE_DEFINITION = {
  gates: [
    "HUMAN_CONFIRMATION_REQUIRED",
    "FIRE_STATUS_KNOWN",
    "HAZARD_STATUS_KNOWN",
    "STRUCTURAL_ROLE_KNOWN",
    "SPECIALIST_FLAG_CLEARED",
  ],
  policy:
    "Unknown fire, hazard, structural, or specialist facts block direct and same-site reuse.",
};
const rubbleFamilies = new Set(["BRICK", "CONCRETE"]);

function assessInventory(row: InventoryRow) {
  return assessRecoveryPathway({
    materialFamily: row.material_family,
    riskFlags: toStringArray(row.risk_flags),
    safetyFacts: toRecord(row.safety_facts),
    specialistReviewRequired: row.specialist_review_required,
    unknowns: toStringArray(row.unknowns),
  });
}

function toGateArray(
  value: unknown,
  status: "BLOCKED" | "PASSED",
): PathwayGate[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const gate = item as Record<string, unknown>;
    if (
      typeof gate.code !== "string" ||
      typeof gate.label !== "string" ||
      typeof gate.reason !== "string"
    ) {
      return [];
    }
    return [
      {
        code: gate.code,
        label: gate.label,
        reason: gate.reason,
        status,
      },
    ];
  });
}

function removalInstruction(assessment: PathwaySheet) {
  if (assessment.preferredPathway === "SPECIALIST_REVIEW") {
    return "Keep the lot segregated and in place where practicable. Obtain the named specialist evidence before assigning a reuse route.";
  }
  if (assessment.preferredPathway === "RECYCLE") {
    return "Remove selectively, prevent contamination with mixed waste, and record handover to an appropriate recycler.";
  }
  if (assessment.preferredPathway === "DIRECT_REUSE") {
    return "Remove intact using reversible methods, label the lot, protect edges and surfaces, and verify dimensions before allocation.";
  }
  if (assessment.preferredPathway === "SAME_SITE_REUSE") {
    return "Remove intact, label by source location, protect during storage, and verify suitability before installation.";
  }
  return "Segregate the lot and record the controlled residual destination.";
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function lotCode(id: string) {
  return `LOT-${id.slice(0, 8).toUpperCase()}`;
}

function toCondition(value: unknown): ConditionSnapshot {
  const record = toRecord(value);
  const conditionValue =
    typeof record.value === "string"
      ? record.value
      : typeof record.grade === "string"
        ? record.grade
        : undefined;
  return {
    ...(typeof record.confidence === "number"
      ? { confidence: record.confidence }
      : {}),
    ...(conditionValue ? { value: conditionValue } : {}),
  };
}

function toQuantity(value: unknown): QuantitySnapshot {
  const record = toRecord(value);
  const maximum =
    typeof record.max === "number"
      ? record.max
      : typeof record.maximum === "number"
        ? record.maximum
        : undefined;
  const minimum =
    typeof record.min === "number"
      ? record.min
      : typeof record.minimum === "number"
        ? record.minimum
        : undefined;
  return {
    ...(typeof record.basis === "string" ? { basis: record.basis } : {}),
    ...(typeof maximum === "number" ? { max: maximum } : {}),
    ...(typeof minimum === "number" ? { min: minimum } : {}),
    ...(typeof record.unit === "string" ? { unit: record.unit } : {}),
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
