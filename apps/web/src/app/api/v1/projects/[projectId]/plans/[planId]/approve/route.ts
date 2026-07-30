import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../../../lib/api";
import { findOwnedProject } from "../../../../../../../../lib/projects";
import {
  approveRecoveryPlan,
  RecoveryConflictError,
  RecoveryNotFoundError,
} from "../../../../../../../../lib/recovery";

export async function POST(
  request: Request,
  context: { params: Promise<{ planId: string; projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(
      401,
      "Sign in to approve the recovery pack.",
      correlationId,
    );
  }
  const { planId, projectId } = await context.params;
  if (
    !isUuid(projectId) ||
    !isUuid(planId) ||
    !(await findOwnedProject(projectId, user.id))
  ) {
    return apiProblem(404, "Recovery plan not found.", correlationId);
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
    const result = await approveRecoveryPlan(planId, projectId, user.id);
    return apiJson({ correlationId, ...result });
  } catch (error) {
    if (error instanceof RecoveryNotFoundError) {
      return apiProblem(404, error.message, correlationId);
    }
    if (error instanceof RecoveryConflictError) {
      return apiProblem(409, error.message, correlationId, "STALE_PLAN");
    }
    return apiProblem(
      503,
      "The recovery pack could not be approved. The draft was retained.",
      correlationId,
    );
  }
}
