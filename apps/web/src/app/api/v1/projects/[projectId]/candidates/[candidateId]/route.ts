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
      evidence: result.evidence,
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
