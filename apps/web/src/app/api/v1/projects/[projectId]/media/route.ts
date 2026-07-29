import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../lib/api";
import {
  EvidenceNotFoundError,
  listMedia,
} from "../../../../../../lib/evidence";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);

  if (!user) {
    return apiProblem(401, "Sign in to view evidence.", correlationId);
  }

  const { projectId } = await context.params;
  if (!isUuid(projectId)) {
    return apiProblem(404, "Project not found.", correlationId);
  }

  try {
    const items = await listMedia(projectId, user.id);
    return apiJson({
      correlationId,
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        readyAt: item.readyAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof EvidenceNotFoundError) {
      return apiProblem(404, "Project not found.", correlationId);
    }
    return apiProblem(
      503,
      "Evidence could not be loaded. Try again.",
      correlationId,
    );
  }
}
