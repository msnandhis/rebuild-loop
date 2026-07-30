import { z } from "zod";

import {
  AnalysisConflictError,
  AnalysisNotFoundError,
  AnalysisValidationError,
  createAnalysis,
} from "../../../../../../lib/analyses";
import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../lib/api";

const bodySchema = z.object({
  mediaIds: z.array(z.uuid()).min(1).max(6),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);

  if (!user) {
    return apiProblem(401, "Sign in to start analysis.", correlationId);
  }

  const { projectId } = await context.params;
  const idempotencyKey = readIdempotencyKey(request);
  if (!isUuid(projectId)) {
    return apiProblem(404, "Project not found.", correlationId);
  }
  if (!idempotencyKey) {
    return apiProblem(
      400,
      "A UUID Idempotency-Key header is required.",
      correlationId,
      "INVALID_IDEMPOTENCY_KEY",
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiProblem(
      400,
      "Choose between one and six verified images.",
      correlationId,
      "INVALID_ANALYSIS_INPUT",
    );
  }

  try {
    const run = await createAnalysis({
      idempotencyKey,
      mediaIds: parsed.data.mediaIds,
      model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
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
      return apiProblem(404, "Project not found.", correlationId);
    }
    if (error instanceof AnalysisValidationError) {
      return apiProblem(
        400,
        error.message,
        correlationId,
        "INVALID_ANALYSIS_INPUT",
      );
    }
    if (error instanceof AnalysisConflictError) {
      return apiProblem(409, error.message, correlationId, "CONFLICT");
    }
    return apiProblem(
      503,
      "Analysis could not be queued. Your verified evidence is retained.",
      correlationId,
      "QUEUE_UNAVAILABLE",
    );
  }
}
