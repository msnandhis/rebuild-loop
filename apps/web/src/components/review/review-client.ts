export type ReviewAction =
  | "CONFIRMED"
  | "CORRECTED"
  | "REJECTED"
  | "EVIDENCE_REQUESTED"
  | "SPECIALIST_REVIEW";

interface ApiProblemShape {
  correlationId?: string;
  error?: { message?: string };
}

export class ReviewClientError extends Error {
  constructor(
    message: string,
    readonly correlationId?: string,
  ) {
    super(message);
    this.name = "ReviewClientError";
  }
}

export async function recordDecision(input: {
  action: ReviewAction;
  correctedValues?: Record<string, unknown>;
  idempotencyKey: string;
  projectId: string;
  reason: string;
  revisionId: string;
  threadId: string;
}) {
  return post<{
    correlationId: string;
    decisionId: string;
  }>(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/candidates/${encodeURIComponent(input.threadId)}/decisions`,
    {
      action: input.action,
      correctedValues: input.correctedValues,
      reason: input.reason,
      revisionId: input.revisionId,
    },
    input.idempotencyKey,
  );
}

export async function requestClarification(input: {
  idempotencyKey: string;
  instruction: string;
  projectId: string;
  rationale: string;
  requiredEvidence: "CLOSE_UP" | "LABEL" | "MEASUREMENT" | "CONTEXT";
  revisionId: string;
  threadId: string;
}) {
  return post<{
    clarificationTaskId: string;
    correlationId: string;
    decisionId: string;
  }>(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/candidates/${encodeURIComponent(input.threadId)}/clarifications`,
    {
      instruction: input.instruction,
      rationale: input.rationale,
      requiredEvidence: input.requiredEvidence,
      revisionId: input.revisionId,
    },
    input.idempotencyKey,
  );
}

export async function submitClarification(input: {
  idempotencyKey: string;
  mediaIds: string[];
  projectId: string;
  taskId: string;
}) {
  return post<{
    analysisId: string;
    correlationId: string;
    statusUrl: string;
  }>(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/clarifications/${encodeURIComponent(input.taskId)}/submissions`,
    { mediaIds: input.mediaIds },
    input.idempotencyKey,
  );
}

async function post<T>(
  url: string,
  body: Record<string, unknown>,
  idempotencyKey: string,
): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    method: "POST",
  });
  let payload: T | ApiProblemShape;
  try {
    payload = (await response.json()) as T | ApiProblemShape;
  } catch {
    throw new ReviewClientError(
      "The server returned an unreadable response. Your previous record is unchanged.",
    );
  }
  if (!response.ok) {
    const problem = payload as ApiProblemShape;
    throw new ReviewClientError(
      problem.error?.message ??
        "The request could not be completed. Your previous record is unchanged.",
      problem.correlationId,
    );
  }
  return payload as T;
}
