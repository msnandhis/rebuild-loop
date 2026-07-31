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
import {
  isFinalReviewDecision,
  listCandidates,
} from "../../../../../../../../lib/candidates";
import {
  calculatePathways,
  createRecoveryPlan,
  RecoveryValidationError,
} from "../../../../../../../../lib/recovery";

const bodySchema = z.object({
  action: z.enum(["CONFIRMED", "CORRECTED", "REJECTED", "SPECIALIST_REVIEW"]),
  correctedValues: z.record(z.string(), z.unknown()).optional(),
  reason: z.string().trim().max(1000).default(""),
  revisionId: z.uuid(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ candidateId: string; projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(
      401,
      "Sign in to record a review decision.",
      correlationId,
    );
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
      "Choose a valid action and provide the required review details.",
      correlationId,
      "INVALID_REVIEW_DECISION",
    );
  }

  try {
    const result = await recordReviewDecision({
      action: parsed.data.action,
      candidateThreadId: candidateId,
      ...(parsed.data.correctedValues
        ? { correctedValues: parsed.data.correctedValues }
        : {}),
      idempotencyKey,
      ownerUserId: user.id,
      projectId,
      reason: parsed.data.reason,
      sourceRevisionId: parsed.data.revisionId,
    });
    let recoveryPlanPrepared = false;
    if (!result.replayed) {
      try {
        await calculatePathways(projectId, user.id);
        const candidates = await listCandidates(projectId, user.id);
        const reviewComplete =
          candidates.length > 0 &&
          candidates.every((candidate) =>
            isFinalReviewDecision(candidate.latest_decision_action),
          );
        if (reviewComplete) {
          await createRecoveryPlan(projectId, user.id);
          recoveryPlanPrepared = true;
        }
      } catch (error) {
        if (!(error instanceof RecoveryValidationError)) {
          console.error("Automatic recovery plan refresh failed", {
            correlationId,
            error,
            projectId,
          });
        }
      }
    }
    return apiJson(
      {
        correlationId,
        decisionId: result.decision.id,
        inventoryRevisionId: result.inventoryRevisionId,
        recoveryPlanPrepared,
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
        "INVALID_REVIEW_DECISION",
      );
    }
    if (error instanceof ReviewConflictError) {
      return apiProblem(409, error.message, correlationId, "STALE_REVISION");
    }
    console.error("Unexpected review decision failure", {
      correlationId,
      error,
      projectId,
    });
    return apiProblem(
      503,
      "The decision could not be recorded. The previous record is unchanged.",
      correlationId,
      "DECISION_UNAVAILABLE",
    );
  }
}
