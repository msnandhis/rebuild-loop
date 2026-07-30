interface AnalysisResponse {
  analysisId: string;
  correlationId: string;
  status: "QUEUED";
  statusUrl: string;
}

interface AnalysisErrorShape {
  correlationId?: string;
  error?: { message?: string };
  message?: string;
}

export async function startProjectAnalysis(input: {
  idempotencyKey: string;
  mediaIds: string[];
  projectId: string;
}): Promise<AnalysisResponse> {
  const response = await fetch(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/analyses`,
    {
      body: JSON.stringify({ mediaIds: input.mediaIds }),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      method: "POST",
    },
  );

  let payload: AnalysisResponse | AnalysisErrorShape;
  try {
    payload = await response.json();
  } catch {
    throw new AnalysisClientError(
      "Analysis could not be started. Your verified evidence is retained.",
    );
  }

  if (!response.ok) {
    const problem = payload as AnalysisErrorShape;
    throw new AnalysisClientError(
      problem.error?.message ??
        problem.message ??
        "Analysis could not be started. Your verified evidence is retained.",
      problem.correlationId,
    );
  }

  return payload as AnalysisResponse;
}

export class AnalysisClientError extends Error {
  constructor(
    message: string,
    readonly correlationId?: string,
  ) {
    super(message);
    this.name = "AnalysisClientError";
  }
}
