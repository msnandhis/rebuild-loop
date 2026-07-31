import "server-only";

import { analysisRuns, auditEvents, getDatabase, projects } from "@rebuild/db";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { cache } from "react";

export async function listProjects(ownerUserId: string) {
  return getDatabase()
    .select()
    .from(projects)
    .where(
      and(eq(projects.ownerUserId, ownerUserId), isNull(projects.archivedAt)),
    )
    .orderBy(desc(projects.updatedAt));
}

// Cached per request so the project shell layout and the page it wraps share
// one query instead of issuing the same lookup twice on every navigation.
export const findOwnedProject = cache(
  async (projectId: string, ownerUserId: string) => {
    if (!isUuid(projectId)) {
      return null;
    }

    const [project] = await getDatabase()
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.ownerUserId, ownerUserId),
          isNull(projects.archivedAt),
        ),
      )
      .limit(1);

    return project ?? null;
  },
);

export async function findActiveProjectAnalysis(
  projectId: string,
  ownerUserId: string,
) {
  const [run] = await getDatabase()
    .select({ id: analysisRuns.id })
    .from(analysisRuns)
    .where(
      and(
        eq(analysisRuns.projectId, projectId),
        eq(analysisRuns.ownerUserId, ownerUserId),
        inArray(analysisRuns.status, ["QUEUED", "RUNNING"]),
      ),
    )
    .orderBy(desc(analysisRuns.createdAt))
    .limit(1);

  return run ?? null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

interface CreateProjectInput {
  locationText: string;
  name: string;
  ownerUserId: string;
  plannedWorkDate?: string;
  scaleNote?: string;
  siteName: string;
  submissionToken: string;
  type: "DEMOLITION" | "MIXED" | "RENOVATION";
}

export async function createProject(input: CreateProjectInput) {
  const database = getDatabase();
  const code = createProjectCode();

  return database.transaction(async (transaction) => {
    const [project] = await transaction
      .insert(projects)
      .values({
        code,
        locationText: input.locationText,
        name: input.name,
        ownerUserId: input.ownerUserId,
        plannedWorkDate: input.plannedWorkDate || null,
        scaleNote: input.scaleNote || null,
        siteName: input.siteName,
        submissionToken: input.submissionToken,
        type: input.type,
      })
      .onConflictDoNothing({
        target: [projects.ownerUserId, projects.submissionToken],
      })
      .returning();

    if (!project) {
      const [existingProject] = await transaction
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.ownerUserId, input.ownerUserId),
            eq(projects.submissionToken, input.submissionToken),
          ),
        )
        .limit(1);

      if (!existingProject) {
        throw new Error("Project insert did not return a record");
      }

      return existingProject;
    }

    await transaction.insert(auditEvents).values({
      actorUserId: input.ownerUserId,
      entityId: project.id,
      entityType: "project",
      eventType: "project.created",
      ownerUserId: input.ownerUserId,
      payload: {
        code: project.code,
        status: project.status,
      },
      projectId: project.id,
    });

    return project;
  });
}

function createProjectCode(): string {
  const time = Date.now().toString(36).toUpperCase();
  const suffix = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `RBL-${time}-${suffix}`;
}
