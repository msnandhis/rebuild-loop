import { createHash } from "node:crypto";

import {
  analyzeEvidenceWithGemini,
  GeminiProviderError,
  validateAnalysisOutput,
} from "@rebuild/analysis";
import {
  analysisAttempts,
  analysisInputs,
  analysisRuns,
  and,
  asc,
  auditEvents,
  candidateRevisions,
  candidateThreads,
  evidenceReferences,
  eq,
  getDatabase,
  mediaAssets,
  modelOutputs,
  projects,
  sql,
} from "@rebuild/db";
import {
  createInternalS3Client,
  getObjectBytes,
  readStorageConfig,
} from "@rebuild/storage";
import sharp from "sharp";
import { z } from "zod";

const payloadSchema = z.object({ analysisRunId: z.uuid() });

export async function analyzeProject(payload: unknown): Promise<void> {
  const { analysisRunId } = payloadSchema.parse(payload);
  const database = getDatabase();
  const [run] = await database
    .select()
    .from(analysisRuns)
    .where(eq(analysisRuns.id, analysisRunId))
    .limit(1);

  if (!run || run.status === "SUCCEEDED" || run.status === "FAILED") {
    return;
  }

  const [attempt] = await database
    .insert(analysisAttempts)
    .values({
      analysisRunId,
      attemptNumber: 1,
      ownerUserId: run.ownerUserId,
      projectId: run.projectId,
    })
    .onConflictDoNothing()
    .returning();

  if (!attempt) {
    await database.transaction(async (transaction) => {
      await transaction
        .update(analysisRuns)
        .set({
          completedAt: new Date(),
          phase: "FAILED",
          retryable: true,
          safeErrorCode: "INTERRUPTED_ATTEMPT",
          safeErrorMessage:
            "The worker restarted before this run completed. The verified evidence is retained.",
          status: "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(analysisRuns.id, analysisRunId));
      await transaction
        .update(projects)
        .set({
          status: "INTAKE_READY",
          updatedAt: new Date(),
          version: sql`${projects.version} + 1`,
        })
        .where(
          and(
            eq(projects.id, run.projectId),
            eq(projects.ownerUserId, run.ownerUserId),
          ),
        );
      await transaction.insert(auditEvents).values({
        actorUserId: null,
        entityId: analysisRunId,
        entityType: "analysis_run",
        eventType: "analysis.interrupted",
        ownerUserId: run.ownerUserId,
        payload: { retryable: true },
        projectId: run.projectId,
      });
    });
    return;
  }

  const startedAt = Date.now();
  await database
    .update(analysisRuns)
    .set({
      phase: "PREPARING_EVIDENCE",
      startedAt: new Date(),
      status: "RUNNING",
      updatedAt: new Date(),
    })
    .where(eq(analysisRuns.id, analysisRunId));

  try {
    const manifest = await database
      .select({
        finalObjectKey: mediaAssets.finalObjectKey,
        mediaAssetId: analysisInputs.mediaAssetId,
        mimeSnapshot: analysisInputs.mimeSnapshot,
        objectVersion: mediaAssets.objectVersion,
        ordinal: analysisInputs.ordinal,
      })
      .from(analysisInputs)
      .innerJoin(
        mediaAssets,
        and(
          eq(mediaAssets.id, analysisInputs.mediaAssetId),
          eq(mediaAssets.projectId, analysisInputs.projectId),
          eq(mediaAssets.ownerUserId, analysisInputs.ownerUserId),
        ),
      )
      .where(eq(analysisInputs.analysisRunId, analysisRunId))
      .orderBy(asc(analysisInputs.ordinal));

    if (
      manifest.length < 1 ||
      manifest.length > 6 ||
      manifest.some((input) => !input.finalObjectKey)
    ) {
      throw new AnalysisTaskError("INVALID_MANIFEST", false);
    }

    const storage = readStorageConfig();
    const storageClient = createInternalS3Client(storage);
    const evidence = [];

    for (const input of manifest) {
      const source = await getObjectBytes(
        storageClient,
        storage.bucket,
        input.finalObjectKey!,
        input.objectVersion ?? undefined,
      );
      const normalized = await sharp(source, {
        animated: false,
        failOn: "error",
        limitInputPixels: 40_000_000,
      })
        .rotate()
        .resize({
          fit: "inside",
          height: 1800,
          withoutEnlargement: true,
          width: 1800,
        })
        .jpeg({ quality: 82 })
        .toBuffer();

      evidence.push({
        assetId: input.mediaAssetId,
        base64: normalized.toString("base64"),
        mimeType: "image/jpeg" as const,
      });
    }

    await database
      .update(analysisRuns)
      .set({ phase: "CALLING_MODEL", updatedAt: new Date() })
      .where(eq(analysisRuns.id, analysisRunId));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    let providerResult;
    try {
      providerResult = await analyzeEvidenceWithGemini({
        apiKey: requireGeminiKey(),
        evidence,
        model: run.model,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    await database
      .update(analysisRuns)
      .set({ phase: "VALIDATING", updatedAt: new Date() })
      .where(eq(analysisRuns.id, analysisRunId));

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(providerResult.rawText);
    } catch {
      await persistInvalidOutput(
        run,
        attempt.id,
        providerResult,
        "SHAPE_INVALID",
      );
      throw new AnalysisTaskError("INVALID_MODEL_OUTPUT", false);
    }

    let output;
    try {
      output = validateAnalysisOutput(
        parsedJson,
        new Set(manifest.map((input) => input.mediaAssetId)),
      );
    } catch {
      await persistInvalidOutput(
        run,
        attempt.id,
        providerResult,
        "SEMANTIC_INVALID",
        parsedJson,
      );
      throw new AnalysisTaskError("INVALID_MODEL_OUTPUT", false);
    }

    await database
      .update(analysisRuns)
      .set({ phase: "PERSISTING", updatedAt: new Date() })
      .where(eq(analysisRuns.id, analysisRunId));

    await database.transaction(async (transaction) => {
      const outputId = crypto.randomUUID();
      await transaction.insert(modelOutputs).values({
        analysisAttemptId: attempt.id,
        analysisRunId,
        extractedRawText: providerResult.rawText,
        finishReason: providerResult.finishReason,
        id: outputId,
        normalizedOutput: output,
        ownerUserId: run.ownerUserId,
        projectId: run.projectId,
        providerEnvelope: providerResult.rawResponse,
        responseHash: createHash("sha256")
          .update(providerResult.rawText)
          .digest("hex"),
        usage: providerResult.usage,
        validationStatus: "VALID",
      });

      for (const candidate of output.candidates) {
        const threadId = crypto.randomUUID();
        const revisionId = crypto.randomUUID();
        await transaction.insert(candidateThreads).values({
          createdFromRunId: analysisRunId,
          id: threadId,
          ownerUserId: run.ownerUserId,
          projectId: run.projectId,
        });
        await transaction.insert(candidateRevisions).values({
          analysisRunId,
          candidateThreadId: threadId,
          clientCandidateKey: candidate.candidateKey,
          condition: {
            confidence: candidate.conditionConfidence,
            grade: candidate.condition,
          },
          disposition: "PROPOSED",
          id: revisionId,
          materialFamily: candidate.materialFamily,
          modelOutputId: outputId,
          normalizedSnapshot: candidate,
          observationSummary: candidate.observationSummary,
          overallConfidence: candidate.overallConfidence,
          ownerUserId: run.ownerUserId,
          preliminaryPathway: candidate.preliminaryPathway,
          projectId: run.projectId,
          quantity: candidate.quantity,
          revisionNumber: 1,
          riskFlags: candidate.riskFlags,
          specialistReviewRequired: candidate.specialistReviewRequired,
          subtype: candidate.subtype,
          unknowns: candidate.unknowns,
        });
        await transaction.insert(evidenceReferences).values(
          candidate.evidence.map((reference, ordinal) => ({
            analysisRunId,
            candidateRevisionId: revisionId,
            locator: reference.region ?? {},
            locatorKind: reference.region
              ? ("REGION" as const)
              : ("FULL_IMAGE" as const),
            mediaAssetId: reference.assetId,
            observation: reference.observation,
            ordinal,
            ownerUserId: run.ownerUserId,
            projectId: run.projectId,
          })),
        );
      }

      await transaction
        .update(analysisAttempts)
        .set({
          finishedAt: new Date(),
          latencyMs: Date.now() - startedAt,
          providerRequestId: providerResult.providerRequestId,
          status: "SUCCEEDED",
        })
        .where(eq(analysisAttempts.id, attempt.id));
      await transaction
        .update(analysisRuns)
        .set({
          completedAt: new Date(),
          phase: "COMPLETE",
          status: "SUCCEEDED",
          updatedAt: new Date(),
        })
        .where(eq(analysisRuns.id, analysisRunId));
      await transaction
        .update(projects)
        .set({
          status: "REVIEW_REQUIRED",
          updatedAt: new Date(),
          version: sql`${projects.version} + 1`,
        })
        .where(
          and(
            eq(projects.id, run.projectId),
            eq(projects.ownerUserId, run.ownerUserId),
          ),
        );
      await transaction.insert(auditEvents).values({
        actorUserId: null,
        entityId: analysisRunId,
        entityType: "analysis_run",
        eventType: "analysis.succeeded",
        ownerUserId: run.ownerUserId,
        payload: { candidateCount: output.candidates.length },
        projectId: run.projectId,
      });
    });
  } catch (error) {
    const safe = safeAnalysisError(error);
    await database.transaction(async (transaction) => {
      await transaction
        .update(analysisAttempts)
        .set({
          finishedAt: new Date(),
          latencyMs: Date.now() - startedAt,
          safeErrorCode: safe.code,
          safeErrorMessage: safe.message,
          status: "FAILED",
        })
        .where(eq(analysisAttempts.id, attempt.id));
      await transaction
        .update(analysisRuns)
        .set({
          completedAt: new Date(),
          phase: "FAILED",
          retryable: safe.retryable,
          safeErrorCode: safe.code,
          safeErrorMessage: safe.message,
          status: "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(analysisRuns.id, analysisRunId));
      await transaction
        .update(projects)
        .set({
          status: "INTAKE_READY",
          updatedAt: new Date(),
          version: sql`${projects.version} + 1`,
        })
        .where(
          and(
            eq(projects.id, run.projectId),
            eq(projects.ownerUserId, run.ownerUserId),
          ),
        );
      await transaction.insert(auditEvents).values({
        actorUserId: null,
        entityId: analysisRunId,
        entityType: "analysis_run",
        eventType: "analysis.failed",
        ownerUserId: run.ownerUserId,
        payload: { code: safe.code, retryable: safe.retryable },
        projectId: run.projectId,
      });
    });
  }
}

class AnalysisTaskError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(code);
  }
}

function safeAnalysisError(error: unknown) {
  if (error instanceof GeminiProviderError) {
    return {
      code: error.code,
      message: error.retryable
        ? "The model service did not complete this run. The evidence is retained."
        : "The model service rejected this run. No proposal was published.",
      retryable: error.retryable,
    };
  }
  if (error instanceof AnalysisTaskError) {
    return {
      code: error.code,
      message:
        error.code === "INVALID_MODEL_OUTPUT"
          ? "The model response did not pass validation. No proposal was published."
          : "The analysis inputs could not be validated.",
      retryable: error.retryable,
    };
  }
  if (error instanceof Error && error.name === "AbortError") {
    return {
      code: "MODEL_TIMEOUT",
      message:
        "The model service timed out. The verified evidence is retained.",
      retryable: true,
    };
  }
  return {
    code: "ANALYSIS_FAILED",
    message: "Analysis stopped safely. No proposal was published.",
    retryable: true,
  };
}

async function persistInvalidOutput(
  run: typeof analysisRuns.$inferSelect,
  attemptId: string,
  result: Awaited<ReturnType<typeof analyzeEvidenceWithGemini>>,
  validationStatus: "SHAPE_INVALID" | "SEMANTIC_INVALID",
  normalizedOutput?: unknown,
) {
  await getDatabase()
    .insert(modelOutputs)
    .values({
      analysisAttemptId: attemptId,
      analysisRunId: run.id,
      extractedRawText: result.rawText,
      finishReason: result.finishReason,
      normalizedOutput,
      ownerUserId: run.ownerUserId,
      projectId: run.projectId,
      providerEnvelope: result.rawResponse,
      responseHash: createHash("sha256").update(result.rawText).digest("hex"),
      usage: result.usage,
      validationStatus,
    });
}

function requireGeminiKey(): string {
  const value = process.env.GEMINI_API_KEY?.trim();
  if (!value) {
    throw new AnalysisTaskError("MODEL_NOT_CONFIGURED", false);
  }
  return value;
}
