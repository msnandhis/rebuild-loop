import "server-only";

import { getSqlClient } from "@rebuild/db";
import {
  createPublicPresigningClient,
  presignEvidenceView,
  readStorageConfig,
} from "@rebuild/storage";

export class CandidateNotFoundError extends Error {}

export function isFinalReviewDecision(action: string | null | undefined) {
  return (
    action === "CONFIRMED" ||
    action === "CORRECTED" ||
    action === "REJECTED" ||
    action === "SPECIALIST_REVIEW"
  );
}

interface CandidateRow {
  candidate_thread_id: string;
  condition: unknown;
  created_at: Date;
  material_family: string;
  observation_summary: string;
  overall_confidence: number;
  preliminary_pathway: string;
  quantity: unknown;
  revision_id: string;
  revision_number: number;
  risk_flags: unknown;
  specialist_review_required: boolean;
  subtype: string | null;
  unknowns: unknown;
  latest_decision_action?: string | null;
  latest_decision_at?: Date | null;
}

interface CandidateRevisionRow extends CandidateRow {
  disposition: string;
  previous_revision_id: string | null;
}

interface EvidenceRow {
  final_object_key: string;
  locator: unknown;
  locator_kind: string;
  media_asset_id: string;
  object_version: string | null;
  observation: string;
  original_filename: string;
  ordinal: number;
}

export async function listCandidates(projectId: string, ownerUserId: string) {
  const sql = getSqlClient();
  return sql<CandidateRow[]>`
    select distinct on (cr.candidate_thread_id)
      cr.candidate_thread_id,
      cr.id as revision_id,
      cr.revision_number,
      cr.material_family,
      cr.subtype,
      cr.observation_summary,
      cr.condition,
      cr.unknowns,
      cr.risk_flags,
      cr.specialist_review_required,
      cr.preliminary_pathway,
      cr.quantity,
      cr.overall_confidence,
      cr.created_at,
      (
        select rd.action::text
        from review_decisions rd
        where rd.candidate_thread_id = cr.candidate_thread_id
          and rd.candidate_revision_id = cr.id
          and rd.project_id = cr.project_id
          and rd.owner_user_id = cr.owner_user_id
        order by rd.created_at desc
        limit 1
      ) as latest_decision_action,
      (
        select rd.created_at
        from review_decisions rd
        where rd.candidate_thread_id = cr.candidate_thread_id
          and rd.candidate_revision_id = cr.id
          and rd.project_id = cr.project_id
          and rd.owner_user_id = cr.owner_user_id
        order by rd.created_at desc
        limit 1
      ) as latest_decision_at
    from candidate_revisions cr
    where cr.project_id = ${projectId}::uuid
      and cr.owner_user_id = ${ownerUserId}
    order by cr.candidate_thread_id, cr.revision_number desc
  `;
}

export async function findCandidate(
  candidateThreadId: string,
  projectId: string,
  ownerUserId: string,
) {
  const sql = getSqlClient();
  const [candidate] = await sql<CandidateRow[]>`
    select
      cr.candidate_thread_id,
      cr.id as revision_id,
      cr.revision_number,
      cr.material_family,
      cr.subtype,
      cr.observation_summary,
      cr.condition,
      cr.unknowns,
      cr.risk_flags,
      cr.specialist_review_required,
      cr.preliminary_pathway,
      cr.quantity,
      cr.overall_confidence,
      cr.created_at
    from candidate_revisions cr
    where cr.candidate_thread_id = ${candidateThreadId}::uuid
      and cr.project_id = ${projectId}::uuid
      and cr.owner_user_id = ${ownerUserId}
    order by cr.revision_number desc
    limit 1
  `;

  if (!candidate) {
    throw new CandidateNotFoundError("Candidate not found");
  }

  const evidenceRows = await sql<EvidenceRow[]>`
    select
      er.media_asset_id,
      er.ordinal,
      er.locator_kind,
      er.locator,
      er.observation,
      ma.original_filename,
      ma.final_object_key,
      ma.object_version
    from evidence_references er
    join media_assets ma
      on ma.id = er.media_asset_id
      and ma.project_id = er.project_id
      and ma.owner_user_id = er.owner_user_id
    where er.candidate_revision_id = ${candidate.revision_id}::uuid
      and er.project_id = ${projectId}::uuid
      and er.owner_user_id = ${ownerUserId}
    order by er.ordinal
  `;
  const storage = readStorageConfig();
  const presigningClient = createPublicPresigningClient(storage);
  const evidence = await Promise.all(
    evidenceRows.map(async (item) => {
      const signed = await presignEvidenceView({
        bucket: storage.bucket,
        client: presigningClient,
        objectKey: item.final_object_key,
        ...(item.object_version ? { versionId: item.object_version } : {}),
      });
      return {
        locator: item.locator,
        locatorKind: item.locator_kind,
        mediaAssetId: item.media_asset_id,
        observation: item.observation,
        ordinal: item.ordinal,
        originalFilename: item.original_filename,
        viewExpiresInSeconds: signed.expiresInSeconds,
        viewUrl: signed.url,
      };
    }),
  );

  const revisions = await sql<CandidateRevisionRow[]>`
    select
      cr.candidate_thread_id,
      cr.id as revision_id,
      cr.revision_number,
      cr.previous_revision_id,
      cr.disposition,
      cr.material_family,
      cr.subtype,
      cr.observation_summary,
      cr.condition,
      cr.unknowns,
      cr.risk_flags,
      cr.specialist_review_required,
      cr.preliminary_pathway,
      cr.quantity,
      cr.overall_confidence,
      cr.created_at
    from candidate_revisions cr
    where cr.candidate_thread_id = ${candidateThreadId}::uuid
      and cr.project_id = ${projectId}::uuid
      and cr.owner_user_id = ${ownerUserId}
    order by cr.revision_number desc
  `;

  return { candidate, evidence, revisions };
}
