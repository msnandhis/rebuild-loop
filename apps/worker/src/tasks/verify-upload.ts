import { createHash } from "node:crypto";

import {
  auditEvents,
  and,
  eq,
  getDatabase,
  mediaAssets,
  projects,
  sql,
  uploadSessions,
} from "@rebuild/db";
import {
  buildFinalObjectKey,
  createInternalS3Client,
  deleteObject,
  getObjectBytes,
  headObject,
  promoteIncomingObject,
  readStorageConfig,
} from "@rebuild/storage";
import sharp from "sharp";
import { z } from "zod";

const payloadSchema = z.object({ uploadSessionId: z.uuid() });
const maximumPixels = 40_000_000;
const mimeByFormat = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export async function verifyUpload(payload: unknown): Promise<void> {
  const { uploadSessionId } = payloadSchema.parse(payload);
  const database = getDatabase();
  const [record] = await database
    .select({
      declaredMime: mediaAssets.declaredMime,
      expectedBytes: mediaAssets.expectedBytes,
      incomingObjectKey: uploadSessions.incomingObjectKey,
      mediaAssetId: mediaAssets.id,
      mediaStatus: mediaAssets.status,
      ownerUserId: mediaAssets.ownerUserId,
      projectId: mediaAssets.projectId,
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
    .where(eq(uploadSessions.id, uploadSessionId))
    .limit(1);

  if (
    !record ||
    record.mediaStatus === "READY" ||
    record.sessionStatus === "COMPLETED"
  ) {
    return;
  }
  if (
    record.mediaStatus !== "VERIFYING" ||
    record.sessionStatus !== "SUBMITTED"
  ) {
    return;
  }

  const storage = readStorageConfig();
  const client = createInternalS3Client(storage);

  try {
    const head = await headObject(
      client,
      storage.bucket,
      record.incomingObjectKey,
    );
    const actualBytes = head.bytes;
    if (
      actualBytes < 1 ||
      actualBytes > 10 * 1024 * 1024 ||
      actualBytes !== record.expectedBytes
    ) {
      await rejectUpload(record, uploadSessionId, "SIZE_MISMATCH");
      await bestEffortDelete(client, storage.bucket, record.incomingObjectKey);
      return;
    }

    const bytes = await getObjectBytes(
      client,
      storage.bucket,
      record.incomingObjectKey,
    );
    const hash = createHash("sha256").update(bytes).digest("hex");
    const metadata = await sharp(bytes, {
      animated: false,
      failOn: "error",
      limitInputPixels: maximumPixels,
    }).metadata();
    const detectedMime =
      metadata.format && metadata.format in mimeByFormat
        ? mimeByFormat[metadata.format as keyof typeof mimeByFormat]
        : null;

    if (
      !detectedMime ||
      detectedMime !== record.declaredMime ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages ?? 1) > 1
    ) {
      await rejectUpload(record, uploadSessionId, "INVALID_IMAGE");
      await bestEffortDelete(client, storage.bucket, record.incomingObjectKey);
      return;
    }

    const finalObjectKey = buildFinalObjectKey({
      mediaAssetId: record.mediaAssetId,
      projectId: record.projectId,
      sha256: hash,
    });
    const promoted = await promoteIncomingObject({
      bucket: storage.bucket,
      client,
      contentType: detectedMime,
      expectedIncomingEtag: head.etag ?? "",
      finalObjectKey,
      incomingObjectKey: record.incomingObjectKey,
      metadata: {
        "evidence-sha256": hash,
        "media-asset-id": record.mediaAssetId,
      },
    });

    await database.transaction(async (transaction) => {
      await transaction
        .update(mediaAssets)
        .set({
          actualBytes,
          detectedMime,
          finalObjectKey,
          height: metadata.height,
          objectEtag: promoted.etag,
          objectVersion: promoted.versionId,
          readyAt: new Date(),
          sha256: hash,
          status: "READY",
          updatedAt: new Date(),
          width: metadata.width,
        })
        .where(
          and(
            eq(mediaAssets.id, record.mediaAssetId),
            eq(mediaAssets.status, "VERIFYING"),
          ),
        );
      await transaction
        .update(uploadSessions)
        .set({
          completedAt: new Date(),
          status: "COMPLETED",
          updatedAt: new Date(),
        })
        .where(eq(uploadSessions.id, uploadSessionId));
      await transaction
        .update(projects)
        .set({
          status: "INTAKE_READY",
          updatedAt: new Date(),
          version: sql`${projects.version} + 1`,
        })
        .where(
          and(
            eq(projects.id, record.projectId),
            eq(projects.ownerUserId, record.ownerUserId),
            eq(projects.status, "DRAFT"),
          ),
        );
      await transaction.insert(auditEvents).values({
        actorUserId: null,
        entityId: record.mediaAssetId,
        entityType: "media_asset",
        eventType: "evidence.ready",
        ownerUserId: record.ownerUserId,
        payload: {
          actualBytes,
          detectedMime,
          height: metadata.height,
          sha256: hash,
          width: metadata.width,
        },
        projectId: record.projectId,
      });
    });
  } catch (error) {
    if (isPermanentImageError(error)) {
      await rejectUpload(record, uploadSessionId, "INVALID_IMAGE");
      await bestEffortDelete(client, storage.bucket, record.incomingObjectKey);
      return;
    }
    throw error;
  }
}

async function rejectUpload(
  record: {
    mediaAssetId: string;
    ownerUserId: string;
    projectId: string;
  },
  uploadSessionId: string,
  rejectionCode: string,
) {
  await getDatabase().transaction(async (transaction) => {
    await transaction
      .update(mediaAssets)
      .set({
        rejectionCode,
        status: "REJECTED",
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, record.mediaAssetId));
    await transaction
      .update(uploadSessions)
      .set({ status: "REJECTED", updatedAt: new Date() })
      .where(eq(uploadSessions.id, uploadSessionId));
    await transaction.insert(auditEvents).values({
      actorUserId: null,
      entityId: record.mediaAssetId,
      entityType: "media_asset",
      eventType: "evidence.rejected",
      ownerUserId: record.ownerUserId,
      payload: { rejectionCode },
      projectId: record.projectId,
    });
  });
}

async function bestEffortDelete(
  client: ReturnType<typeof createInternalS3Client>,
  bucket: string,
  key: string,
) {
  try {
    await deleteObject(client, bucket, key);
  } catch {
    // A scheduled orphan sweep can remove an incoming object later.
  }
}

function isPermanentImageError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /Input buffer|unsupported image|pixel limit|corrupt|invalid/i.test(
      error.message,
    )
  );
}
