import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../lib/api";
import { findOwnedProject } from "../../../../../../lib/projects";
import {
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
    return apiProblem(401, "Sign in to draft a recovery pack.", correlationId);
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
    const plan = await createRecoveryPlan(projectId, user.id);
    return apiJson(
      { correlationId, planId: plan.id, reused: plan.reused },
      201,
    );
  } catch (error) {
    if (error instanceof RecoveryValidationError) {
      return apiProblem(409, error.message, correlationId, "PLAN_BLOCKED");
    }
    return apiProblem(
      503,
      "The recovery pack could not be drafted. Existing records were retained.",
      correlationId,
    );
  }
}
