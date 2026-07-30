import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../../lib/api";
import { findOwnedProject } from "../../../../../../../lib/projects";
import { findCurrentRecoveryPlan } from "../../../../../../../lib/recovery";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(401, "Sign in to view the recovery pack.", correlationId);
  }
  const { projectId } = await context.params;
  if (!isUuid(projectId) || !(await findOwnedProject(projectId, user.id))) {
    return apiProblem(404, "Project not found.", correlationId);
  }

  try {
    const plan = await findCurrentRecoveryPlan(projectId, user.id);
    return apiJson({
      correlationId,
      plan: plan
        ? {
            ...plan,
            approvedAt: plan.approvedAt?.toISOString() ?? null,
            createdAt: plan.createdAt.toISOString(),
          }
        : null,
    });
  } catch {
    return apiProblem(
      503,
      "The recovery pack is temporarily unavailable.",
      correlationId,
    );
  }
}
