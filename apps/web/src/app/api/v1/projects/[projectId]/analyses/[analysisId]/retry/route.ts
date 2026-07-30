import {
  AnalysisConflictError,
  AnalysisNotFoundError,
  retryAnalysis,
} from "../../../../../../../../lib/analyses";
import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../../../lib/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ analysisId: string; projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(401, "Sign in to retry analysis.", correlationId);
  }

  const { analysisId, projectId } = await context.params;
  const idempotencyKey = readIdempotencyKey(request);
  if (!isUuid(projectId) || !isUuid(analysisId)) {
    return apiProblem(404, "Analysis not found.", correlationId);
  }
  if (!idempotencyKey) {
    return apiProblem(
      400,
      "A UUID Idempotency-Key header is required.",
      correlationId,
      "INVALID_IDEMPOTENCY_KEY",
    );
  }

  try {
    const run = await retryAnalysis({
      analysisId,
      idempotencyKey,
      ownerUserId: user.id,
      projectId,
    });
    return apiJson(
      {
        analysisId: run.id,
        correlationId,
        status: run.status,
        statusUrl: `/api/v1/projects/${projectId}/analyses/${run.id}`,
      },
      202,
    );
  } catch (error) {
    if (error instanceof AnalysisNotFoundError) {
      return apiProblem(404, "Analysis not found.", correlationId);
    }
    if (error instanceof AnalysisConflictError) {
      return apiProblem(409, error.message, correlationId, "CONFLICT");
    }
    return apiProblem(
      503,
      "Analysis could not be retried. The original run and evidence are retained.",
      correlationId,
      "QUEUE_UNAVAILABLE",
    );
  }
}
