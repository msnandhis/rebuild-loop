import { z } from "zod";

import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
  readIdempotencyKey,
} from "../../../../../../../lib/api";
import {
  EvidenceConflictError,
  EvidenceNotFoundError,
  initiateUpload,
} from "../../../../../../../lib/evidence";

const bodySchema = z.object({
  clientChecksum: z.string().regex(/^[0-9a-f]{64}$/),
  declaredMime: z.enum(["image/jpeg", "image/png", "image/webp"]),
  expectedBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
  filename: z.string().trim().min(1).max(255),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);

  if (!user) {
    return apiProblem(401, "Sign in to upload evidence.", correlationId);
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
      "Choose a JPEG, PNG or WebP image no larger than 10 MB.",
      correlationId,
      "INVALID_UPLOAD",
    );
  }

  try {
    const upload = await initiateUpload({
      ...parsed.data,
      idempotencyKey,
      ownerUserId: user.id,
      projectId,
    });

    if (!upload.uploadUrl) {
      return apiProblem(
        409,
        "This upload request has already been submitted.",
        correlationId,
        "UPLOAD_ALREADY_SUBMITTED",
      );
    }

    return apiJson(
      {
        assetId: upload.assetId,
        correlationId,
        expiresAt: upload.expiresAt.toISOString(),
        requiredHeaders: upload.requiredHeaders,
        uploadId: upload.uploadId,
        uploadUrl: upload.uploadUrl,
      },
      201,
    );
  } catch (error) {
    if (error instanceof EvidenceNotFoundError) {
      return apiProblem(404, "Project not found.", correlationId);
    }
    if (error instanceof EvidenceConflictError) {
      return apiProblem(409, error.message, correlationId, "CONFLICT");
    }

    return apiProblem(
      503,
      "Secure upload is temporarily unavailable. Try again.",
      correlationId,
      "STORAGE_UNAVAILABLE",
    );
  }
}
