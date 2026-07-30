import "server-only";

import { createHash } from "node:crypto";

import { getSqlClient } from "@rebuild/db";

export class ClarificationConflictError extends Error {}
export class ClarificationNotFoundError extends Error {}
export class ClarificationValidationError extends Error {}

interface SubmitClarificationInput {
  idempotencyKey: string;
  mediaIds: string[];
  ownerUserId: string;
  projectId: string;
  taskId: string;
}

interface ClarificationTaskRow {
  candidate_thread_id: string;
  id: string;
  instruction: string;
  rationale: string;
  required_evidence: string;
  source_analysis_run_id: string;
  source_revision_id: string;
  status: string;
}

interface ClarificationListRow extends ClarificationTaskRow {
  created_at: Date;
  resolved_at: Date | null;
  resolving_revision_id: string | null;
  updated_at: Date;
}

interface MediaRow {
  actual_bytes: number;
  detected_mime: string;
  height: number;
  id: string;
  sha256: string;
  width: number;
}

interface AnalysisRow {
  id: string;
  model: string;
  prompt_version: string;
  request_hash: string;
  schema_version: string;
  status: string;
}

export async function listClarificationTasks(
  candidateThreadId: string,
  projectId: string,
  ownerUserId: string,
) {
  return getSqlClient()<ClarificationListRow[]>`
    select
      ct.id,
      ct.candidate_thread_id,
      ct.source_revision_id,
      ct.instruction,
      ct.rationale,
      ct.required_evidence,
      ct.status,
      ct.resolving_revision_id,
      ct.resolved_at,
      ct.created_at,
      ct.updated_at,
      cr.analysis_run_id as source_analysis_run_id
    from clarification_tasks ct
    join candidate_revisions cr
      on cr.id = ct.source_revision_id
      and cr.candidate_thread_id = ct.candidate_thread_id
      and cr.project_id = ct.project_id
      and cr.owner_user_id = ct.owner_user_id
    where ct.candidate_thread_id = ${candidateThreadId}::uuid
      and ct.project_id = ${projectId}::uuid
      and ct.owner_user_id = ${ownerUserId}
    order by ct.created_at desc
  `;
}

export async function listOpenProjectClarificationTasks(
  projectId: string,
  ownerUserId: string,
) {
  return getSqlClient()<ClarificationListRow[]>`
    select
      ct.id,
      ct.candidate_thread_id,
      ct.source_revision_id,
      ct.instruction,
      ct.rationale,
      ct.required_evidence,
      ct.status,
      ct.resolving_revision_id,
      ct.resolved_at,
      ct.created_at,
      ct.updated_at,
      cr.analysis_run_id as source_analysis_run_id
    from clarification_tasks ct
    join candidate_revisions cr
      on cr.id = ct.source_revision_id
      and cr.candidate_thread_id = ct.candidate_thread_id
      and cr.project_id = ct.project_id
      and cr.owner_user_id = ct.owner_user_id
    where ct.project_id = ${projectId}::uuid
      and ct.owner_user_id = ${ownerUserId}
      and ct.status = 'OPEN'
    order by ct.created_at asc
  `;
}

export async function submitClarificationEvidence(
  input: SubmitClarificationInput,
) {
  const mediaIds = [...new Set(input.mediaIds)].sort();
  if (mediaIds.length < 1 || mediaIds.length > 6) {
    throw new ClarificationValidationError(
      "Choose between one and six verified clarification images.",
    );
  }

  const sql = getSqlClient();
  return sql.begin(async (transaction) => {
    const [task] = await transaction<ClarificationTaskRow[]>`
      select
        ct.id,
        ct.candidate_thread_id,
        ct.source_revision_id,
        ct.instruction,
        ct.rationale,
        ct.required_evidence,
        ct.status,
        cr.analysis_run_id as source_analysis_run_id
      from clarification_tasks ct
      join candidate_revisions cr
        on cr.id = ct.source_revision_id
        and cr.candidate_thread_id = ct.candidate_thread_id
        and cr.project_id = ct.project_id
        and cr.owner_user_id = ct.owner_user_id
      where ct.id = ${input.taskId}::uuid
        and ct.project_id = ${input.projectId}::uuid
        and ct.owner_user_id = ${input.ownerUserId}
      limit 1
      for update of ct
    `;
    if (!task) {
      throw new ClarificationNotFoundError("Clarification task not found.");
    }

    const media = await transaction<MediaRow[]>`
      select
        id, sha256, actual_bytes, detected_mime, width, height
      from media_assets
      where id = any(${mediaIds}::uuid[])
        and project_id = ${input.projectId}::uuid
        and owner_user_id = ${input.ownerUserId}
        and status = 'READY'
      order by id
    `;
    if (
      media.length !== mediaIds.length ||
      media.some(
        (item) =>
          !item.sha256 ||
          !item.actual_bytes ||
          !item.detected_mime ||
          !item.width ||
          !item.height,
      )
    ) {
      throw new ClarificationValidationError(
        "Every clarification image must finish server verification first.",
      );
    }

    const [source] = await transaction<AnalysisRow[]>`
      select id, model, prompt_version, schema_version, status, request_hash
      from analysis_runs
      where id = ${task.source_analysis_run_id}::uuid
        and project_id = ${input.projectId}::uuid
        and owner_user_id = ${input.ownerUserId}
      limit 1
    `;
    if (!source) {
      throw new ClarificationNotFoundError(
        "The source analysis is no longer available.",
      );
    }

    const requestHash = hashJson({
      candidateThreadId: task.candidate_thread_id,
      mediaIds,
      sourceRevisionId: task.source_revision_id,
      taskId: task.id,
    });
    const [existing] = await transaction<AnalysisRow[]>`
      select id, model, prompt_version, schema_version, status, request_hash
      from analysis_runs
      where owner_user_id = ${input.ownerUserId}
        and project_id = ${input.projectId}::uuid
        and idempotency_key = ${input.idempotencyKey}::uuid
      limit 1
    `;
    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw new ClarificationConflictError(
          "The idempotency key was already used for another clarification.",
        );
      }
      return { run: existing, task, replayed: true };
    }
    if (task.status !== "OPEN") {
      throw new ClarificationConflictError(
        "This clarification has already been submitted.",
      );
    }

    const [active] = await transaction<{ id: string }[]>`
      select id from analysis_runs
      where owner_user_id = ${input.ownerUserId}
        and project_id = ${input.projectId}::uuid
        and status in ('QUEUED', 'RUNNING')
      limit 1
    `;
    if (active) {
      throw new ClarificationConflictError(
        "Another analysis is already running for this project.",
      );
    }

    const inputHash = createHash("sha256")
      .update(
        media
          .map((item) => item.sha256)
          .sort()
          .join(":"),
      )
      .digest("hex");
    const runId = crypto.randomUUID();
    const [run] = await transaction<AnalysisRow[]>`
      insert into analysis_runs (
        id, owner_user_id, project_id, kind, base_run_id,
        clarification_task_id, status, phase,
        model, prompt_version, schema_version, input_hash,
        idempotency_key, request_hash
      )
      values (
        ${runId}::uuid, ${input.ownerUserId}, ${input.projectId}::uuid,
        'CLARIFICATION', ${source.id}::uuid, ${task.id}::uuid,
        'QUEUED', 'QUEUED',
        ${source.model}, ${source.prompt_version}, ${source.schema_version},
        ${inputHash}, ${input.idempotencyKey}::uuid, ${requestHash}
      )
      returning id, model, prompt_version, schema_version, status, request_hash
    `;
    if (!run) {
      throw new Error("Clarification analysis insert returned no record.");
    }

    for (const [ordinal, item] of media.entries()) {
      await transaction`
        insert into analysis_inputs (
          owner_user_id, project_id, analysis_run_id, media_asset_id,
          ordinal, purpose, sha256_snapshot, bytes_snapshot,
          mime_snapshot, width_snapshot, height_snapshot
        )
        values (
          ${input.ownerUserId}, ${input.projectId}::uuid, ${runId}::uuid,
          ${item.id}::uuid, ${ordinal}, ${`CLARIFICATION:${task.id}`},
          ${item.sha256}, ${item.actual_bytes}, ${item.detected_mime},
          ${item.width}, ${item.height}
        )
      `;
      await transaction`
        insert into clarification_submissions (
          owner_user_id, project_id, clarification_task_id,
          media_asset_id, submitted_by_user_id
        )
        values (
          ${input.ownerUserId}, ${input.projectId}::uuid, ${task.id}::uuid,
          ${item.id}::uuid, ${input.ownerUserId}
        )
        on conflict (clarification_task_id, media_asset_id) do nothing
      `;
    }

    await transaction`
      update clarification_tasks
      set status = 'SUBMITTED', updated_at = now()
      where id = ${task.id}::uuid
        and project_id = ${input.projectId}::uuid
        and owner_user_id = ${input.ownerUserId}
    `;
    await transaction`
      update projects
      set status = 'ANALYSING', version = version + 1, updated_at = now()
      where id = ${input.projectId}::uuid
        and owner_user_id = ${input.ownerUserId}
    `;
    await transaction`
      insert into audit_events (
        owner_user_id, project_id, actor_user_id, event_type,
        entity_type, entity_id, payload
      )
      values (
        ${input.ownerUserId}, ${input.projectId}::uuid, ${input.ownerUserId},
        'clarification.submitted', 'clarification_task', ${task.id},
        ${JSON.stringify({
          analysisRunId: runId,
          candidateThreadId: task.candidate_thread_id,
          mediaIds,
          sourceRevisionId: task.source_revision_id,
        })}::jsonb
      )
    `;
    await transaction`
      insert into workflow_jobs (task, payload, job_key)
      values (
        'analyze_project',
        ${JSON.stringify({
          analysisRunId: runId,
          candidateThreadId: task.candidate_thread_id,
          clarificationTaskId: task.id,
          sourceRevisionId: task.source_revision_id,
        })}::jsonb,
        ${`analysis:${runId}`}
      )
    `;

    return { run, task, replayed: false };
  });
}

function hashJson(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
