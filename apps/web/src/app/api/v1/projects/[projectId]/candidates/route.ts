import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../lib/api";
import { listCandidates } from "../../../../../../lib/candidates";
import { findOwnedProject } from "../../../../../../lib/projects";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(401, "Sign in to view proposals.", correlationId);
  }

  const { projectId } = await context.params;
  if (!isUuid(projectId)) {
    return apiProblem(404, "Project not found.", correlationId);
  }
  if (!(await findOwnedProject(projectId, user.id))) {
    return apiProblem(404, "Project not found.", correlationId);
  }

  try {
    const rows = await listCandidates(projectId, user.id);
    return apiJson({
      correlationId,
      items: rows.map((row) => ({
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
      })),
    });
  } catch {
    return apiProblem(
      503,
      "Model proposals are temporarily unavailable.",
      correlationId,
    );
  }
}
