import "server-only";

import { createHash } from "node:crypto";

import { getSqlClient } from "@rebuild/db";

export type ReviewAction =
  | "CONFIRMED"
  | "CORRECTED"
  | "REJECTED"
  | "EVIDENCE_REQUESTED"
  | "SPECIALIST_REVIEW";

export type ClarificationEvidenceType =
  "CLOSE_UP" | "CONTEXT" | "LABEL" | "MEASUREMENT";

export interface RecordReviewDecisionInput {
  action: ReviewAction;
  candidateThreadId: string;
  correctedValues?: Record<string, unknown>;
  idempotencyKey: string;
  ownerUserId: string;
  projectId: string;
  reason?: string;
  sourceRevisionId: string;
  clarification?: {
    instruction: string;
    rationale: string;
    requiredEvidence: ClarificationEvidenceType;
  };
}

export class ReviewConflictError extends Error {}
export class ReviewNotFoundError extends Error {}
export class ReviewValidationError extends Error {}

interface CandidateRow {
  condition: unknown;
  id: string;
  material_family: string;
  normalized_snapshot: unknown;
  quantity: unknown;
  revision_number: number;
  risk_flags: unknown;
  specialist_review_required: boolean;
  subtype: string | null;
}

interface DecisionRow {
  action: ReviewAction;
  candidate_revision_id: string;
  created_at: Date;
  edited_values: unknown;
  id: string;
  reason: string | null;
  request_hash: string;
}

/**
 * Appends a human review decision. Confirm/correct decisions atomically publish
 * a human-owned inventory revision; evidence requests atomically open a
 * clarification task. Reusing an idempotency key returns the original result.
 */
export async function recordReviewDecision(input: RecordReviewDecisionInput) {
  validateDecision(input);
  const requestHash = hashJson({
    action: input.action,
    candidateThreadId: input.candidateThreadId,
    clarification: input.clarification ?? null,
    correctedValues: input.correctedValues ?? {},
    reason: input.reason?.trim() || null,
    sourceRevisionId: input.sourceRevisionId,
  });
  const sql = getSqlClient();

  return sql.begin(async (transaction) => {
    const [existing] = await transaction<DecisionRow[]>`
      select id, candidate_revision_id, action, reason, edited_values, request_hash, created_at
      from review_decisions
      where owner_user_id = ${input.ownerUserId}
        and project_id = ${input.projectId}::uuid
        and idempotency_key = ${input.idempotencyKey}::uuid
      limit 1
    `;

    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw new ReviewConflictError(
          "The idempotency key was already used for another review decision.",
        );
      }
      const [inventory] = await transaction<{ id: string }[]>`
        select id from inventory_item_revisions
        where source_decision_id = ${existing.id}::uuid
          and project_id = ${input.projectId}::uuid
          and owner_user_id = ${input.ownerUserId}
        limit 1
      `;
      const [task] = await transaction<{ id: string }[]>`
        select id from clarification_tasks
        where project_id = ${input.projectId}::uuid
          and owner_user_id = ${input.ownerUserId}
          and source_revision_id = ${existing.candidate_revision_id}::uuid
          and created_at >= ${existing.created_at}
        order by created_at asc
        limit 1
      `;
      return {
        clarificationTaskId: task?.id ?? null,
        decision: existing,
        inventoryRevisionId: inventory?.id ?? null,
        replayed: true,
      };
    }

    const [candidate] = await transaction<CandidateRow[]>`
      select
        cr.id,
        cr.revision_number,
        cr.material_family,
        cr.subtype,
        cr.condition,
        cr.quantity,
        cr.risk_flags,
        cr.specialist_review_required,
        cr.normalized_snapshot
      from candidate_revisions cr
      where cr.id = ${input.sourceRevisionId}::uuid
        and cr.candidate_thread_id = ${input.candidateThreadId}::uuid
        and cr.project_id = ${input.projectId}::uuid
        and cr.owner_user_id = ${input.ownerUserId}
      limit 1
      for update
    `;

    if (!candidate) {
      throw new ReviewNotFoundError("Candidate revision not found.");
    }

    const [latest] = await transaction<{ id: string }[]>`
      select id
      from candidate_revisions
      where candidate_thread_id = ${input.candidateThreadId}::uuid
        and project_id = ${input.projectId}::uuid
        and owner_user_id = ${input.ownerUserId}
      order by revision_number desc
      limit 1
    `;
    if (latest?.id !== candidate.id) {
      throw new ReviewConflictError(
        "A newer candidate revision is available. Review it before deciding.",
      );
    }

    const [decision] = await transaction<DecisionRow[]>`
      insert into review_decisions (
        owner_user_id, project_id, candidate_thread_id,
        candidate_revision_id, actor_user_id, action, reason,
        edited_values, idempotency_key, request_hash
      )
      values (
        ${input.ownerUserId}, ${input.projectId}::uuid,
        ${input.candidateThreadId}::uuid, ${candidate.id}::uuid,
        ${input.ownerUserId}, ${input.action},
        ${input.reason?.trim() || null},
        ${JSON.stringify(input.correctedValues ?? {})}::jsonb,
        ${input.idempotencyKey}::uuid, ${requestHash}
      )
      returning id, candidate_revision_id, action, reason, edited_values, request_hash, created_at
    `;
    if (!decision) {
      throw new Error("Review decision insert did not return a record.");
    }

    let inventoryRevisionId: string | null = null;
    if (
      input.action === "CONFIRMED" ||
      input.action === "CORRECTED" ||
      input.action === "SPECIALIST_REVIEW"
    ) {
      const [inventory] = await transaction<{ id: string }[]>`
        insert into inventory_items (
          owner_user_id, project_id, candidate_thread_id, status
        )
        values (
          ${input.ownerUserId}, ${input.projectId}::uuid,
          ${input.candidateThreadId}::uuid, 'CONFIRMED'
        )
        on conflict (candidate_thread_id)
        do update set status = 'CONFIRMED', updated_at = now()
        where inventory_items.owner_user_id = excluded.owner_user_id
          and inventory_items.project_id = excluded.project_id
        returning id
      `;
      if (!inventory) {
        throw new ReviewConflictError(
          "The inventory lot belongs to another project.",
        );
      }

      const humanSnapshot = mergeRecord(
        candidate.normalized_snapshot,
        input.correctedValues ?? {},
      );
      const [inventoryRevision] = await transaction<{ id: string }[]>`
        insert into inventory_item_revisions (
          owner_user_id, project_id, inventory_item_id,
          source_candidate_revision_id, source_decision_id, revision_number,
          material_family, subtype, condition, quantity, safety_facts,
          risk_flags, specialist_review_required, human_snapshot
        )
        values (
          ${input.ownerUserId}, ${input.projectId}::uuid, ${inventory.id}::uuid,
          ${candidate.id}::uuid, ${decision.id}::uuid,
          (
            select coalesce(max(revision_number), 0) + 1
            from inventory_item_revisions
            where inventory_item_id = ${inventory.id}::uuid
          ),
          ${readString(humanSnapshot.materialFamily) ?? candidate.material_family},
          ${readNullableString(humanSnapshot.subtype) ?? candidate.subtype},
          ${JSON.stringify(
            humanSnapshot.condition ?? candidate.condition,
          )}::jsonb,
          ${JSON.stringify(
            humanSnapshot.quantity ?? candidate.quantity,
          )}::jsonb,
          ${JSON.stringify(readRecord(humanSnapshot.safetyFacts))}::jsonb,
          ${JSON.stringify(
            humanSnapshot.riskFlags ?? candidate.risk_flags,
          )}::jsonb,
          ${
            input.action === "SPECIALIST_REVIEW"
              ? true
              : (readBoolean(humanSnapshot.specialistReviewRequired) ??
                candidate.specialist_review_required)
          },
          ${JSON.stringify(humanSnapshot)}::jsonb
        )
        returning id
      `;
      inventoryRevisionId = inventoryRevision?.id ?? null;
    } else if (input.action === "REJECTED") {
      await transaction`
        insert into inventory_items (
          owner_user_id, project_id, candidate_thread_id, status
        )
        values (
          ${input.ownerUserId}, ${input.projectId}::uuid,
          ${input.candidateThreadId}::uuid, 'REJECTED'
        )
        on conflict (candidate_thread_id)
        do update set status = 'REJECTED', updated_at = now()
        where inventory_items.owner_user_id = excluded.owner_user_id
          and inventory_items.project_id = excluded.project_id
      `;
    }

    let clarificationTaskId: string | null = null;
    if (input.action === "EVIDENCE_REQUESTED" && input.clarification) {
      const [task] = await transaction<{ id: string }[]>`
        insert into clarification_tasks (
          owner_user_id, project_id, candidate_thread_id, source_revision_id,
          instruction, rationale, required_evidence
        )
        values (
          ${input.ownerUserId}, ${input.projectId}::uuid,
          ${input.candidateThreadId}::uuid, ${candidate.id}::uuid,
          ${input.clarification.instruction.trim()},
          ${input.clarification.rationale.trim()},
          ${input.clarification.requiredEvidence}
        )
        returning id
      `;
      clarificationTaskId = task?.id ?? null;
    }

    await transaction`
      insert into audit_events (
        owner_user_id, project_id, actor_user_id, event_type,
        entity_type, entity_id, payload
      )
      values (
        ${input.ownerUserId}, ${input.projectId}::uuid, ${input.ownerUserId},
        'candidate.reviewed', 'review_decision', ${decision.id},
        ${JSON.stringify({
          action: input.action,
          candidateRevisionId: candidate.id,
          clarificationTaskId,
          inventoryRevisionId,
        })}::jsonb
      )
    `;
    const projectStatus =
      input.action === "CONFIRMED" ||
      input.action === "CORRECTED" ||
      input.action === "SPECIALIST_REVIEW"
        ? "INVENTORY_CONFIRMED"
        : "REVIEW_REQUIRED";
    await transaction`
      update projects
      set status = ${projectStatus}, version = version + 1, updated_at = now()
      where id = ${input.projectId}::uuid
        and owner_user_id = ${input.ownerUserId}
    `;

    return {
      clarificationTaskId,
      decision,
      inventoryRevisionId,
      replayed: false,
    };
  });
}

export async function listReviewDecisions(
  candidateThreadId: string,
  projectId: string,
  ownerUserId: string,
) {
  return getSqlClient()<DecisionRow[]>`
    select id, candidate_revision_id, action, reason, edited_values, request_hash, created_at
    from review_decisions
    where candidate_thread_id = ${candidateThreadId}::uuid
      and project_id = ${projectId}::uuid
      and owner_user_id = ${ownerUserId}
    order by created_at desc
  `;
}

function validateDecision(input: RecordReviewDecisionInput): void {
  if (
    (input.action === "CORRECTED" &&
      Object.keys(input.correctedValues ?? {}).length === 0) ||
    (input.action === "EVIDENCE_REQUESTED" && !input.clarification)
  ) {
    throw new ReviewValidationError(
      input.action === "CORRECTED"
        ? "Corrected values are required."
        : "Clarification details are required.",
    );
  }
  if (
    ["REJECTED", "EVIDENCE_REQUESTED", "SPECIALIST_REVIEW"].includes(
      input.action,
    ) &&
    !input.reason?.trim()
  ) {
    throw new ReviewValidationError("A reason is required for this decision.");
  }
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function mergeRecord(
  base: unknown,
  changes: Record<string, unknown>,
): Record<string, unknown> {
  return { ...readRecord(base), ...changes };
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNullableString(value: unknown): string | null {
  return value === null ? null : readString(value);
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}
