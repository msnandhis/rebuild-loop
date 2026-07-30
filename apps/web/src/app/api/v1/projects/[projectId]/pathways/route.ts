import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../lib/api";
import { findOwnedProject } from "../../../../../../lib/projects";
import {
  calculatePathways,
  listPathwayAssessments,
  RecoveryValidationError,
} from "../../../../../../lib/recovery";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(401, "Sign in to view recovery routes.", correlationId);
  }
  const { projectId } = await context.params;
  if (!isUuid(projectId) || !(await findOwnedProject(projectId, user.id))) {
    return apiProblem(404, "Project not found.", correlationId);
  }
  try {
    const items = await listPathwayAssessments(projectId, user.id);
    return apiJson({
      correlationId,
      items: items.map((item) => ({
        ...item,
        assessedAt: item.assessedAt.toISOString(),
      })),
    });
  } catch {
    return apiProblem(
      503,
      "Recovery routes are temporarily unavailable.",
      correlationId,
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(
      401,
      "Sign in to calculate recovery routes.",
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
    const result = await calculatePathways(projectId, user.id);
    return apiJson({ correlationId, ...result }, 201);
  } catch (error) {
    if (error instanceof RecoveryValidationError) {
      return apiProblem(409, error.message, correlationId, "PATHWAY_BLOCKED");
    }
    return apiProblem(
      503,
      "Recovery routes could not be calculated. Confirmed lots were retained.",
      correlationId,
    );
  }
}
