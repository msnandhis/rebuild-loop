import type { StorageClient } from "./client.js";
import { objectUrl, presignRequest } from "./signature.js";

const maximumUploadExpirySeconds = 15 * 60;
const maximumViewExpirySeconds = 5 * 60;

function boundedExpiry(
  requested: number | undefined,
  fallback: number,
  maximum: number,
): number {
  const value = requested ?? fallback;
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`expirySeconds must be between 1 and ${maximum}`);
  }
  return value;
}

export interface PresignedUpload {
  expiresInSeconds: number;
  headers: Readonly<Record<string, string>>;
  url: string;
}

export async function presignIncomingUpload(input: {
  bucket: string;
  checksumSha256Base64: string;
  client: StorageClient;
  contentType: string;
  expirySeconds?: number;
  incomingObjectKey: string;
}): Promise<PresignedUpload> {
  const expiresInSeconds = boundedExpiry(
    input.expirySeconds,
    10 * 60,
    maximumUploadExpirySeconds,
  );
  const headers = {
    "content-type": input.contentType,
    "x-amz-checksum-sha256": input.checksumSha256Base64,
  };
  return {
    expiresInSeconds,
    headers,
    url: presignRequest({
      client: input.client,
      expiresInSeconds,
      headers,
      method: "PUT",
      url: objectUrl(input.client, input.bucket, input.incomingObjectKey),
    }),
  };
}

export async function presignEvidenceView(input: {
  bucket: string;
  client: StorageClient;
  expirySeconds?: number;
  objectKey: string;
  versionId?: string;
}): Promise<{ expiresInSeconds: number; url: string }> {
  const expiresInSeconds = boundedExpiry(
    input.expirySeconds,
    maximumViewExpirySeconds,
    maximumViewExpirySeconds,
  );
  const url = objectUrl(input.client, input.bucket, input.objectKey);
  if (input.versionId) {
    url.searchParams.set("versionId", input.versionId);
  }
  return {
    expiresInSeconds,
    url: presignRequest({
      client: input.client,
      expiresInSeconds,
      method: "GET",
      url,
    }),
  };
}
