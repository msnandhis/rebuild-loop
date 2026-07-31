import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../lib/api";
import {
  isFinalReviewDecision,
  listCandidates,
} from "../../../../../../lib/candidates";
import { findOwnedProject } from "../../../../../../lib/projects";
import {
  calculatePathways,
  createRecoveryPlan,
  RecoveryValidationError,
} from "../../../../../../lib/recovery";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(
      401,
      "Sign in to prepare the recovery plan.",
      correlationId,
    );
  }
  const { projectId } = await context.params;
  if (!isUuid(projectId) || !(await findOwnedProject(projectId, user.id))) {
    return apiProblem(404, "Project not found.", correlationId);
  }
  if (!readIdempotencyKey(request)) {
    return apiProblem(
      400,
      "A UUID Idempotency-Key header is required.",
      correlationId,
      "INVALID_IDEMPOTENCY_KEY",
    );
  }

  try {
    const candidates = await listCandidates(projectId, user.id);
    if (
      candidates.length === 0 ||
      candidates.some(
        (candidate) => !isFinalReviewDecision(candidate.latest_decision_action),
      )
    ) {
      return apiProblem(
        409,
        "Review every material proposal before preparing the recovery plan.",
        correlationId,
        "REVIEW_INCOMPLETE",
      );
    }
    await calculatePathways(projectId, user.id);
    const plan = await createRecoveryPlan(projectId, user.id);
    return apiJson(
      { correlationId, planId: plan.id, reused: plan.reused },
      201,
    );
  } catch (error) {
    if (error instanceof RecoveryValidationError) {
      return apiProblem(409, error.message, correlationId, "PLAN_BLOCKED");
    }
    console.error("Unexpected recovery plan preparation failure", {
      correlationId,
      error,
      projectId,
    });
    return apiProblem(
      503,
      "The recovery plan could not be prepared. Your confirmed materials are unchanged.",
      correlationId,
    );
  }
}
