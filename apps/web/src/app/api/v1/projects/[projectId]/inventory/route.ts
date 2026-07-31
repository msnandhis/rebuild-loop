import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../lib/api";
import { findOwnedProject } from "../../../../../../lib/projects";
import { listConfirmedInventory } from "../../../../../../lib/recovery";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(
      401,
      "Sign in to view confirmed materials.",
      correlationId,
    );
  }
  const { projectId } = await context.params;
  if (!isUuid(projectId) || !(await findOwnedProject(projectId, user.id))) {
    return apiProblem(404, "Project not found.", correlationId);
  }

  try {
    const items = await listConfirmedInventory(projectId, user.id);
    return apiJson({
      correlationId,
      items: items.map((item) => ({
        ...item,
        confirmedAt: item.confirmedAt.toISOString(),
      })),
    });
  } catch {
    return apiProblem(
      503,
      "Confirmed materials are temporarily unavailable.",
      correlationId,
    );
  }
}
