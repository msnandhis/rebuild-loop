import {
  apiJson,
  apiProblem,
  getApiUser,
  isUuid,
} from "../../../../../../lib/api";
import { findOwnedProject } from "../../../../../../lib/projects";
import { listProjectAuditEvents } from "../../../../../../lib/recovery";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const correlationId = crypto.randomUUID();
  const user = await getApiUser(request);
  if (!user) {
    return apiProblem(401, "Sign in to view audit history.", correlationId);
  }

  const { projectId } = await context.params;
  if (!isUuid(projectId)) {
    return apiProblem(404, "Project not found.", correlationId);
  }
  if (!(await findOwnedProject(projectId, user.id))) {
    return apiProblem(404, "Project not found.", correlationId);
  }

  try {
    const events = await listProjectAuditEvents(projectId, user.id);
    return apiJson({
      correlationId,
      items: events.map((event) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
      })),
    });
  } catch {
    return apiProblem(
      503,
      "Audit history is temporarily unavailable.",
      correlationId,
    );
  }
}
