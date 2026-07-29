import {
  findAnalysis,
  AnalysisNotFoundError,
} from "../../../../../../../lib/analyses";
import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../../lib/api";

export async function GET(
  request: Request,
  context: { params: Promise<{ analysisId: string; projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);

  if (!user) {
    return apiProblem(401, "Sign in to view analysis.", correlationId);
  }

  const { analysisId, projectId } = await context.params;
  if (!isUuid(projectId) || !isUuid(analysisId)) {
    return apiProblem(404, "Analysis not found.", correlationId);
  }

  try {
    const { inputs, run } = await findAnalysis(analysisId, projectId, user.id);
    return apiJson({
      analysis: {
        completedAt: run.completedAt?.toISOString() ?? null,
        createdAt: run.createdAt.toISOString(),
        id: run.id,
        inputCount: inputs.length,
        model: run.model,
        phase: run.phase,
        promptVersion: run.promptVersion,
        retryable: Boolean(run.retryable),
        safeErrorCode: run.safeErrorCode,
        safeErrorMessage: run.safeErrorMessage,
        schemaVersion: run.schemaVersion,
        startedAt: run.startedAt?.toISOString() ?? null,
        status: run.status,
        updatedAt: run.updatedAt.toISOString(),
      },
      correlationId,
    });
  } catch (error) {
    if (error instanceof AnalysisNotFoundError) {
      return apiProblem(404, "Analysis not found.", correlationId);
    }
    return apiProblem(
      503,
      "Analysis status is temporarily unavailable.",
      correlationId,
    );
  }
}
