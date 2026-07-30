import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../../lib/api";
import {
  CandidateNotFoundError,
  findCandidate,
} from "../../../../../../../lib/candidates";
import { listClarificationTasks } from "../../../../../../../lib/clarifications";
import { listReviewDecisions } from "../../../../../../../lib/review-decisions";

export async function GET(
  request: Request,
  context: { params: Promise<{ candidateId: string; projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(401, "Sign in to view this proposal.", correlationId);
  }

  const { candidateId, projectId } = await context.params;
  if (!isUuid(projectId) || !isUuid(candidateId)) {
    return apiProblem(404, "Proposal not found.", correlationId);
  }

  try {
    const result = await findCandidate(candidateId, projectId, user.id);
    const [clarifications, decisions] = await Promise.all([
      listClarificationTasks(candidateId, projectId, user.id),
      listReviewDecisions(candidateId, projectId, user.id),
    ]);
    const row = result.candidate;
    return apiJson({
      candidate: {
        candidateThreadId: row.candidate_thread_id,
        condition: row.condition,
        createdAt: row.created_at.toISOString(),
        materialFamily: row.material_family,
        observationSummary: row.observation_summary,
        overallConfidence: row.overall_confidence,
        preliminaryPathway: row.preliminary_pathway,
        revisionId: row.revision_id,
        revisionNumber: row.revision_number,
        riskFlags: row.risk_flags,
        specialistReviewRequired: Boolean(row.specialist_review_required),
        subtype: row.subtype,
        unknowns: row.unknowns,
      },
      correlationId,
      clarifications: clarifications.map((task) => ({
        createdAt: task.created_at.toISOString(),
        id: task.id,
        instruction: task.instruction,
        rationale: task.rationale,
        requiredEvidence: task.required_evidence,
        resolvedAt: task.resolved_at?.toISOString() ?? null,
        resolvingRevisionId: task.resolving_revision_id,
        sourceRevisionId: task.source_revision_id,
        status: task.status,
        updatedAt: task.updated_at.toISOString(),
      })),
      decisions: decisions.map((decision) => ({
        action: decision.action,
        createdAt: decision.created_at.toISOString(),
        editedValues: decision.edited_values,
        id: decision.id,
        reason: decision.reason,
        revisionId: decision.candidate_revision_id,
      })),
      evidence: result.evidence,
      revisions: result.revisions.map((revision, index) => ({
        condition: revision.condition,
        createdAt: revision.created_at.toISOString(),
        disposition: revision.disposition,
        isCurrent: index === 0,
        materialFamily: revision.material_family,
        observationSummary: revision.observation_summary,
        overallConfidence: revision.overall_confidence,
        preliminaryPathway: revision.preliminary_pathway,
        previousRevisionId: revision.previous_revision_id,
        quantity: revision.quantity,
        revisionId: revision.revision_id,
        revisionNumber: revision.revision_number,
        riskFlags: revision.risk_flags,
        specialistReviewRequired: Boolean(revision.specialist_review_required),
        subtype: revision.subtype,
        unknowns: revision.unknowns,
      })),
    });
  } catch (error) {
    if (error instanceof CandidateNotFoundError) {
      return apiProblem(404, "Proposal not found.", correlationId);
    }
    return apiProblem(
      503,
      "Proposal evidence is temporarily unavailable.",
      correlationId,
    );
  }
}
