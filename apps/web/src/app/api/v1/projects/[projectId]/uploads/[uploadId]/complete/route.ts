import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../../../lib/api";
import {
  EvidenceConflictError,
  EvidenceNotFoundError,
  submitUpload,
} from "../../../../../../../../lib/evidence";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string; uploadId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);

  if (!user) {
    return apiProblem(401, "Sign in to submit evidence.", correlationId);
  }

  const { projectId, uploadId } = await context.params;
  if (!isUuid(projectId) || !isUuid(uploadId)) {
    return apiProblem(
      404,
      "The upload reference is invalid.",
      correlationId,
      "INVALID_UPLOAD_REFERENCE",
    );
  }

  try {
    const result = await submitUpload(projectId, uploadId, user.id);
    return apiJson({ ...result, correlationId }, 202);
  } catch (error) {
    if (error instanceof EvidenceNotFoundError) {
      return apiProblem(
        404,
        "The upload record was not found.",
        correlationId,
        "UPLOAD_NOT_FOUND",
      );
    }
    if (error instanceof EvidenceConflictError) {
      return apiProblem(409, error.message, correlationId, "CONFLICT");
    }

    return apiProblem(
      503,
      "Verification could not be queued. Your uploaded bytes are retained; try again.",
      correlationId,
      "QUEUE_UNAVAILABLE",
    );
  }
}
