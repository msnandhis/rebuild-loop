import "server-only";

import { createHash } from "node:crypto";

import {
  analysisInputs,
  analysisRuns,
  auditEvents,
  getDatabase,
  mediaAssets,
  projects,
  workflowJobs,
} from "@rebuild/db";
import { PROMPT_VERSION, SCHEMA_VERSION } from "@rebuild/analysis";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

export class AnalysisConflictError extends Error {}
export class AnalysisNotFoundError extends Error {}
export class AnalysisValidationError extends Error {}

interface CreateAnalysisInput {
  idempotencyKey: string;
  mediaIds: string[];
  model: string;
  ownerUserId: string;
  projectId: string;
}

export async function createAnalysis(input: CreateAnalysisInput) {
  const sortedMediaIds = [...new Set(input.mediaIds)].sort();
  if (sortedMediaIds.length < 1 || sortedMediaIds.length > 6) {
    throw new AnalysisValidationError(
      "Choose between one and six verified images.",
    );
  }

  const requestHash = hashJson({
    mediaIds: sortedMediaIds,
    model: input.model,
    promptVersion: PROMPT_VERSION,
    schemaVersion: SCHEMA_VERSION,
  });
  const database = getDatabase();

  return database.transaction(async (transaction) => {
    const [project] = await transaction
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, input.projectId),
          eq(projects.ownerUserId, input.ownerUserId),
        ),
      )
      .limit(1);

    if (!project) {
      throw new AnalysisNotFoundError("Project not found");
    }

    const [existing] = await transaction
      .select()
      .from(analysisRuns)
      .where(
        and(
          eq(analysisRuns.ownerUserId, input.ownerUserId),
          eq(analysisRuns.projectId, input.projectId),
          eq(analysisRuns.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new AnalysisConflictError(
          "The idempotency key was already used for a different analysis.",
        );
      }
      return existing;
    }

    const assets = await transaction
      .select()
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.ownerUserId, input.ownerUserId),
          eq(mediaAssets.projectId, input.projectId),
          eq(mediaAssets.status, "READY"),
          inArray(mediaAssets.id, sortedMediaIds),
        ),
      )
      .orderBy(asc(mediaAssets.id));

    if (
      assets.length !== sortedMediaIds.length ||
      assets.some(
        (asset) =>
          !asset.sha256 ||
          !asset.detectedMime ||
          !asset.actualBytes ||
          !asset.width ||
          !asset.height,
      )
    ) {
      throw new AnalysisValidationError(
        "Every selected image must finish server verification first.",
      );
    }

    const inputHash = createHash("sha256")
      .update(
        assets
          .map((asset) => asset.sha256)
          .sort()
          .join(":"),
      )
      .digest("hex");
    const runId = crypto.randomUUID();
    const [run] = await transaction
      .insert(analysisRuns)
      .values({
        id: runId,
        idempotencyKey: input.idempotencyKey,
        inputHash,
        model: input.model,
        ownerUserId: input.ownerUserId,
        projectId: input.projectId,
        promptVersion: PROMPT_VERSION,
        requestHash,
        schemaVersion: SCHEMA_VERSION,
      })
      .returning();

    if (!run) {
      throw new Error("Analysis insert did not return a record");
    }

    await transaction.insert(analysisInputs).values(
      assets.map((asset, ordinal) => ({
        analysisRunId: runId,
        bytesSnapshot: asset.actualBytes!,
        heightSnapshot: asset.height!,
        mediaAssetId: asset.id,
        mimeSnapshot: asset.detectedMime!,
        ordinal,
        ownerUserId: input.ownerUserId,
        projectId: input.projectId,
        sha256Snapshot: asset.sha256!,
        widthSnapshot: asset.width!,
      })),
    );
    await transaction
      .update(projects)
      .set({ status: "ANALYSING", updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, input.projectId),
          eq(projects.ownerUserId, input.ownerUserId),
        ),
      );
    await transaction.insert(auditEvents).values({
      actorUserId: input.ownerUserId,
      entityId: runId,
      entityType: "analysis_run",
      eventType: "analysis.queued",
      ownerUserId: input.ownerUserId,
      payload: {
        inputCount: assets.length,
        model: input.model,
        promptVersion: PROMPT_VERSION,
        schemaVersion: SCHEMA_VERSION,
      },
      projectId: input.projectId,
    });
    await transaction
      .insert(workflowJobs)
      .values({
        jobKey: `analysis:${runId}`,
        payload: { analysisRunId: runId },
        task: "analyze_project",
      })
      .onConflictDoNothing({ target: workflowJobs.jobKey });

    return run;
  });
}

export async function findAnalysis(
  analysisId: string,
  projectId: string,
  ownerUserId: string,
) {
  const [run] = await getDatabase()
    .select()
    .from(analysisRuns)
    .where(
      and(
        eq(analysisRuns.id, analysisId),
        eq(analysisRuns.projectId, projectId),
        eq(analysisRuns.ownerUserId, ownerUserId),
      ),
    )
    .limit(1);

  if (!run) {
    throw new AnalysisNotFoundError("Analysis not found");
  }

  const inputs = await getDatabase()
    .select({
      mediaAssetId: analysisInputs.mediaAssetId,
      ordinal: analysisInputs.ordinal,
    })
    .from(analysisInputs)
    .where(
      and(
        eq(analysisInputs.analysisRunId, analysisId),
        eq(analysisInputs.projectId, projectId),
        eq(analysisInputs.ownerUserId, ownerUserId),
      ),
    )
    .orderBy(asc(analysisInputs.ordinal));

  return { inputs, run };
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
