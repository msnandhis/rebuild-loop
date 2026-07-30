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
import { and, asc, eq, inArray } from "drizzle-orm";

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

interface RetryAnalysisInput {
  analysisId: string;
  idempotencyKey: string;
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

export async function retryAnalysis(input: RetryAnalysisInput) {
  const database = getDatabase();

  return database.transaction(async (transaction) => {
    const [source] = await transaction
      .select()
      .from(analysisRuns)
      .where(
        and(
          eq(analysisRuns.id, input.analysisId),
          eq(analysisRuns.projectId, input.projectId),
          eq(analysisRuns.ownerUserId, input.ownerUserId),
        ),
      )
      .limit(1);

    if (!source) {
      throw new AnalysisNotFoundError("Analysis not found");
    }

    const requestHash = hashJson({
      baseRunId: source.id,
      inputHash: source.inputHash,
      model: source.model,
      promptVersion: source.promptVersion,
      schemaVersion: source.schemaVersion,
    });
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
      if (
        existing.requestHash !== requestHash ||
        existing.baseRunId !== source.id
      ) {
        throw new AnalysisConflictError(
          "The idempotency key was already used for a different analysis.",
        );
      }
      return existing;
    }

    if (source.status !== "FAILED" || !source.retryable) {
      throw new AnalysisConflictError(
        source.status === "FAILED"
          ? "This failure cannot be retried safely. Review the error and submit different evidence."
          : "Only a failed analysis can be retried.",
      );
    }

    const inputs = await transaction
      .select()
      .from(analysisInputs)
      .where(
        and(
          eq(analysisInputs.analysisRunId, source.id),
          eq(analysisInputs.projectId, input.projectId),
          eq(analysisInputs.ownerUserId, input.ownerUserId),
        ),
      )
      .orderBy(asc(analysisInputs.ordinal));
    if (inputs.length === 0) {
      throw new AnalysisConflictError(
        "The original analysis has no retained evidence to retry.",
      );
    }

    const runId = crypto.randomUUID();
    const [run] = await transaction
      .insert(analysisRuns)
      .values({
        baseRunId: source.id,
        clarificationTaskId: source.clarificationTaskId,
        id: runId,
        idempotencyKey: input.idempotencyKey,
        inputHash: source.inputHash,
        kind: source.kind,
        model: source.model,
        ownerUserId: input.ownerUserId,
        projectId: input.projectId,
        promptVersion: source.promptVersion,
        requestHash,
        schemaVersion: source.schemaVersion,
      })
      .returning();
    if (!run) {
      throw new Error("Analysis retry insert did not return a record");
    }

    await transaction.insert(analysisInputs).values(
      inputs.map((item) => ({
        analysisRunId: runId,
        bytesSnapshot: item.bytesSnapshot,
        heightSnapshot: item.heightSnapshot,
        mediaAssetId: item.mediaAssetId,
        mimeSnapshot: item.mimeSnapshot,
        ordinal: item.ordinal,
        ownerUserId: input.ownerUserId,
        projectId: input.projectId,
        purpose: item.purpose,
        sha256Snapshot: item.sha256Snapshot,
        widthSnapshot: item.widthSnapshot,
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
      eventType: "analysis.retry_queued",
      ownerUserId: input.ownerUserId,
      payload: { sourceAnalysisRunId: source.id },
      projectId: input.projectId,
    });
    await transaction.insert(workflowJobs).values({
      jobKey: `analysis:${runId}`,
      payload: { analysisRunId: runId },
      task: "analyze_project",
    });

    return run;
  });
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
