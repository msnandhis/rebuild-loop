import { z } from "zod";

import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../../../lib/api";
import {
  recordReviewDecision,
  ReviewConflictError,
  ReviewNotFoundError,
  ReviewValidationError,
} from "../../../../../../../../lib/review-decisions";

const bodySchema = z.object({
  instruction: z.string().trim().min(10).max(500),
  rationale: z.string().trim().min(3).max(500),
  requiredEvidence: z.enum(["CLOSE_UP", "LABEL", "MEASUREMENT", "CONTEXT"]),
  revisionId: z.uuid(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ candidateId: string; projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(401, "Sign in to request evidence.", correlationId);
  }

  const { candidateId, projectId } = await context.params;
  const idempotencyKey = readIdempotencyKey(request);
  if (!isUuid(projectId) || !isUuid(candidateId)) {
    return apiProblem(404, "Proposal not found.", correlationId);
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
      "Describe one specific evidence request and why it changes the decision.",
      correlationId,
      "INVALID_CLARIFICATION",
    );
  }

  try {
    const result = await recordReviewDecision({
      action: "EVIDENCE_REQUESTED",
      candidateThreadId: candidateId,
      clarification: parsed.data,
      idempotencyKey,
      ownerUserId: user.id,
      projectId,
      reason: parsed.data.rationale,
      sourceRevisionId: parsed.data.revisionId,
    });
    if (!result.clarificationTaskId) {
      throw new Error("Clarification task was not created.");
    }
    return apiJson(
      {
        clarificationTaskId: result.clarificationTaskId,
        correlationId,
        decisionId: result.decision.id,
        replayed: result.replayed,
      },
      result.replayed ? 200 : 201,
    );
  } catch (error) {
    if (error instanceof ReviewNotFoundError) {
      return apiProblem(404, "Proposal not found.", correlationId);
    }
    if (error instanceof ReviewValidationError) {
      return apiProblem(
        400,
        error.message,
        correlationId,
        "INVALID_CLARIFICATION",
      );
    }
    if (error instanceof ReviewConflictError) {
      return apiProblem(409, error.message, correlationId, "STALE_REVISION");
    }
    return apiProblem(
      503,
      "The evidence request could not be recorded. Try again.",
      correlationId,
      "CLARIFICATION_UNAVAILABLE",
    );
  }
}
