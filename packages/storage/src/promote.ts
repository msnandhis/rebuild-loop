import type { StorageClient } from "./client.js";
import { encodeCopySource } from "./keys.js";
import { deleteObject, headObject } from "./requests.js";
import { objectUrl, signedFetch } from "./signature.js";

export interface PromotedObject {
  etag?: string;
  incomingObjectDeleted: boolean;
  versionId?: string;
}

export async function promoteIncomingObject(input: {
  bucket: string;
  client: StorageClient;
  contentType: string;
  expectedIncomingEtag: string;
  finalObjectKey: string;
  incomingObjectKey: string;
  metadata?: Record<string, string>;
}): Promise<PromotedObject> {
  const response = await signedFetch({
    client: input.client,
    headers: {
      "content-type": input.contentType,
      "x-amz-copy-source": `/${encodeCopySource(input.bucket, input.incomingObjectKey)}`,
      "x-amz-copy-source-if-match": input.expectedIncomingEtag,
      "x-amz-metadata-directive": "REPLACE",
      ...Object.fromEntries(
        Object.entries(input.metadata ?? {}).map(([key, value]) => [
          `x-amz-meta-${key}`,
          value,
        ]),
      ),
    },
    method: "PUT",
    url: objectUrl(input.client, input.bucket, input.finalObjectKey),
  });
  if (!response.ok) {
    throw new Error(`Object promotion failed with status ${response.status}`);
  }

  const promoted = await headObject(
    input.client,
    input.bucket,
    input.finalObjectKey,
  );
  let incomingObjectDeleted = false;
  try {
    await deleteObject(input.client, input.bucket, input.incomingObjectKey);
    incomingObjectDeleted = true;
  } catch {
    // A cleanup task can remove the incoming object after promotion.
  }

  return {
    ...(promoted.etag ? { etag: promoted.etag } : {}),
    incomingObjectDeleted,
    ...(promoted.versionId ? { versionId: promoted.versionId } : {}),
  };
}
