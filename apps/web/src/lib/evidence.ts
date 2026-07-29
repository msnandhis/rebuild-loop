import "server-only";

import { createHash } from "node:crypto";

import {
  auditEvents,
  getDatabase,
  getSqlClient,
  mediaAssets,
  projects,
  uploadSessions,
  workflowJobs,
} from "@rebuild/db";
import {
  buildIncomingObjectKey,
  createPublicPresigningClient,
  presignIncomingUpload,
  readStorageConfig,
} from "@rebuild/storage";
import { and, desc, eq } from "drizzle-orm";

const uploadLifetimeMs = 10 * 60 * 1_000;

export interface InitiateUploadInput {
  clientChecksum: string;
  declaredMime: "image/jpeg" | "image/png" | "image/webp";
  expectedBytes: number;
  filename: string;
  idempotencyKey: string;
  ownerUserId: string;
  projectId: string;
}

export class EvidenceConflictError extends Error {}
export class EvidenceNotFoundError extends Error {}

export async function initiateUpload(input: InitiateUploadInput) {
  const requestHash = hashJson({
    clientChecksum: input.clientChecksum,
    declaredMime: input.declaredMime,
    expectedBytes: input.expectedBytes,
    filename: input.filename,
  });
  const database = getDatabase();

  const record = await database.transaction(async (transaction) => {
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
      throw new EvidenceNotFoundError("Project not found");
    }

    const [existing] = await transaction
      .select()
      .from(uploadSessions)
      .where(
        and(
          eq(uploadSessions.ownerUserId, input.ownerUserId),
          eq(uploadSessions.projectId, input.projectId),
          eq(uploadSessions.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new EvidenceConflictError(
          "The idempotency key was already used for different upload details.",
        );
      }

      if (
        existing.status === "OPEN" &&
        existing.expiresAt.getTime() <= Date.now()
      ) {
        const renewedExpiresAt = new Date(Date.now() + uploadLifetimeMs);
        const [renewed] = await transaction
          .update(uploadSessions)
          .set({ expiresAt: renewedExpiresAt, updatedAt: new Date() })
          .where(eq(uploadSessions.id, existing.id))
          .returning();

        await transaction.insert(auditEvents).values({
          actorUserId: input.ownerUserId,
          entityId: existing.id,
          entityType: "upload_session",
          eventType: "evidence.upload_link_renewed",
          ownerUserId: input.ownerUserId,
          payload: { mediaAssetId: existing.mediaAssetId },
          projectId: input.projectId,
        });

        return renewed ?? { ...existing, expiresAt: renewedExpiresAt };
      }

      return existing;
    }

    const mediaId = crypto.randomUUID();
    const uploadId = crypto.randomUUID();
    const incomingObjectKey = buildIncomingObjectKey(uploadId);
    const expiresAt = new Date(Date.now() + uploadLifetimeMs);

    await transaction.insert(mediaAssets).values({
      declaredMime: input.declaredMime,
      expectedBytes: input.expectedBytes,
      id: mediaId,
      originalFilename: input.filename,
      ownerUserId: input.ownerUserId,
      projectId: input.projectId,
    });
    const [session] = await transaction
      .insert(uploadSessions)
      .values({
        expiresAt,
        id: uploadId,
        idempotencyKey: input.idempotencyKey,
        incomingObjectKey,
        mediaAssetId: mediaId,
        ownerUserId: input.ownerUserId,
        projectId: input.projectId,
        requestHash,
      })
      .returning();

    if (!session) {
      throw new Error("Upload session insert did not return a record");
    }

    await transaction.insert(auditEvents).values({
      actorUserId: input.ownerUserId,
      entityId: uploadId,
      entityType: "upload_session",
      eventType: "evidence.upload_initiated",
      ownerUserId: input.ownerUserId,
      payload: {
        declaredMime: input.declaredMime,
        expectedBytes: input.expectedBytes,
        mediaAssetId: mediaId,
      },
      projectId: input.projectId,
    });

    return session;
  });

  if (record.status !== "OPEN") {
    return {
      assetId: record.mediaAssetId,
      expiresAt: record.expiresAt,
      requiredHeaders: {},
      status: record.status,
      uploadId: record.id,
      uploadUrl: null,
    };
  }

  const config = readStorageConfig();
  const checksumSha256Base64 = Buffer.from(
    input.clientChecksum,
    "hex",
  ).toString("base64");
  const signed = await presignIncomingUpload({
    bucket: config.bucket,
    checksumSha256Base64,
    client: createPublicPresigningClient(config),
    contentType: input.declaredMime,
    expirySeconds: Math.max(
      1,
      Math.min(
        600,
        Math.floor((record.expiresAt.getTime() - Date.now()) / 1_000),
      ),
    ),
    incomingObjectKey: record.incomingObjectKey,
  });

  return {
    assetId: record.mediaAssetId,
    expiresAt: new Date(Date.now() + signed.expiresInSeconds * 1_000),
    requiredHeaders: signed.headers,
    status: record.status,
    uploadId: record.id,
    uploadUrl: signed.url,
  };
}

export async function listMedia(projectId: string, ownerUserId: string) {
  const [project] = await getDatabase()
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.ownerUserId, ownerUserId)),
    )
    .limit(1);

  if (!project) {
    throw new EvidenceNotFoundError("Project not found");
  }

  const sql = getSqlClient();
  await sql`
    with expired as (
      update upload_sessions
      set status = 'EXPIRED', updated_at = now()
      where project_id = ${projectId}::uuid
        and owner_user_id = ${ownerUserId}
        and status = 'OPEN'
        and expires_at < now() - interval '1 hour'
      returning media_asset_id
    )
    update media_assets
    set status = 'REJECTED',
        rejection_code = 'UPLOAD_EXPIRED',
        updated_at = now()
    where id in (select media_asset_id from expired)
      and status = 'PENDING_UPLOAD'
  `;

  return getDatabase()
    .select({
      actualBytes: mediaAssets.actualBytes,
      createdAt: mediaAssets.createdAt,
      declaredMime: mediaAssets.declaredMime,
      detectedMime: mediaAssets.detectedMime,
      expectedBytes: mediaAssets.expectedBytes,
      id: mediaAssets.id,
      originalFilename: mediaAssets.originalFilename,
      readyAt: mediaAssets.readyAt,
      rejectionCode: mediaAssets.rejectionCode,
      status: mediaAssets.status,
    })
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.projectId, projectId),
        eq(mediaAssets.ownerUserId, ownerUserId),
      ),
    )
    .orderBy(desc(mediaAssets.createdAt));
}

export async function submitUpload(
  projectId: string,
  uploadId: string,
  ownerUserId: string,
) {
  const database = getDatabase();

  return database.transaction(async (transaction) => {
    const [session] = await transaction
      .select({
        assetStatus: mediaAssets.status,
        mediaAssetId: uploadSessions.mediaAssetId,
        sessionStatus: uploadSessions.status,
      })
      .from(uploadSessions)
      .innerJoin(
        mediaAssets,
        and(
          eq(mediaAssets.id, uploadSessions.mediaAssetId),
          eq(mediaAssets.projectId, uploadSessions.projectId),
          eq(mediaAssets.ownerUserId, uploadSessions.ownerUserId),
        ),
      )
      .where(
        and(
          eq(uploadSessions.id, uploadId),
          eq(uploadSessions.projectId, projectId),
          eq(uploadSessions.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);

    if (!session) {
      throw new EvidenceNotFoundError("Upload not found");
    }

    if (
      session.sessionStatus === "COMPLETED" ||
      session.assetStatus === "READY"
    ) {
      return { assetId: session.mediaAssetId, status: "READY" as const };
    }

    if (session.sessionStatus !== "OPEN") {
      throw new EvidenceConflictError(
        "This upload can no longer be submitted.",
      );
    }

    await transaction
      .update(uploadSessions)
      .set({
        status: "SUBMITTED",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(uploadSessions.id, uploadId));
    await transaction
      .update(mediaAssets)
      .set({ status: "VERIFYING", updatedAt: new Date() })
      .where(eq(mediaAssets.id, session.mediaAssetId));
    await transaction.insert(auditEvents).values({
      actorUserId: ownerUserId,
      entityId: uploadId,
      entityType: "upload_session",
      eventType: "evidence.upload_submitted",
      ownerUserId,
      payload: { mediaAssetId: session.mediaAssetId },
      projectId,
    });

    await transaction
      .insert(workflowJobs)
      .values({
        jobKey: `verify:${uploadId}`,
        payload: { uploadSessionId: uploadId },
        task: "verify_upload",
      })
      .onConflictDoNothing({ target: workflowJobs.jobKey });

    return { assetId: session.mediaAssetId, status: "VERIFYING" as const };
  });
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
