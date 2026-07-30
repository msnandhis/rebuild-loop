import { z } from "zod";

import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../../../lib/api";
import {
  ClarificationConflictError,
  ClarificationNotFoundError,
  ClarificationValidationError,
  submitClarificationEvidence,
} from "../../../../../../../../lib/clarifications";

const bodySchema = z.object({
  mediaIds: z.array(z.uuid()).min(1).max(6),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string; taskId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(
      401,
      "Sign in to submit clarification evidence.",
      correlationId,
    );
  }

  const { projectId, taskId } = await context.params;
  const idempotencyKey = readIdempotencyKey(request);
  if (!isUuid(projectId) || !isUuid(taskId)) {
    return apiProblem(404, "Clarification task not found.", correlationId);
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
      "Choose between one and six verified clarification images.",
      correlationId,
      "INVALID_CLARIFICATION_EVIDENCE",
    );
  }

  try {
    const result = await submitClarificationEvidence({
      idempotencyKey,
      mediaIds: parsed.data.mediaIds,
      ownerUserId: user.id,
      projectId,
      taskId,
    });
    return apiJson(
      {
        analysisId: result.run.id,
        correlationId,
        replayed: result.replayed,
        status: result.run.status,
        statusUrl: `/api/v1/projects/${projectId}/analyses/${result.run.id}`,
      },
      result.replayed ? 200 : 202,
    );
  } catch (error) {
    if (error instanceof ClarificationNotFoundError) {
      return apiProblem(404, error.message, correlationId);
    }
    if (error instanceof ClarificationValidationError) {
      return apiProblem(
        400,
        error.message,
        correlationId,
        "INVALID_CLARIFICATION_EVIDENCE",
      );
    }
    if (error instanceof ClarificationConflictError) {
      return apiProblem(409, error.message, correlationId, "CONFLICT");
    }
    return apiProblem(
      503,
      "Re-analysis could not be queued. The verified evidence is retained.",
      correlationId,
      "QUEUE_UNAVAILABLE",
    );
  }
}
