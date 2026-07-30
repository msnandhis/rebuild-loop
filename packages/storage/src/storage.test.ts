import { describe, expect, test } from "vitest";

import {
  buildFinalObjectKey,
  buildIncomingObjectKey,
  createPublicPresigningClient,
  encodeCopySource,
  presignIncomingUpload,
  readStorageConfig,
} from "./index.js";

const projectId = "149d220c-f00b-4b85-8853-c21bf201597b";
const assetId = "60e84372-9517-49e1-91f1-c242efb020ed";
const uploadId = "fe5f8467-c579-4f65-8bcb-b9bdb6f60254";
const digest = "a".repeat(64);

describe("evidence object keys", () => {
  test("uses opaque IDs and a content hash for final evidence", () => {
    expect(buildIncomingObjectKey(uploadId)).toBe(`incoming/${uploadId}`);
    expect(
      buildFinalObjectKey({
        mediaAssetId: assetId,
        projectId,
        sha256: digest,
      }),
    ).toBe(`projects/${projectId}/assets/${assetId}/${digest}`);
  });

  test("rejects path material that is not an expected UUID or digest", () => {
    expect(() => buildIncomingObjectKey("../escape")).toThrow(/UUID/);
    expect(() =>
      buildFinalObjectKey({
        mediaAssetId: assetId,
        projectId,
        sha256: "not-a-digest",
      }),
    ).toThrow(/sha256/);
  });

  test("encodes copy sources without destroying path separators", () => {
    expect(encodeCopySource("private bucket", "incoming/a b")).toBe(
      "private%20bucket/incoming/a%20b",
    );
  });
});

describe("storage configuration and signing", () => {
  test("keeps browser and service endpoints separate", async () => {
    const config = readStorageConfig({
      S3_ACCESS_KEY: "test-access",
      S3_BUCKET: "rebuild-loop",
      S3_FORCE_PATH_STYLE: "true",
      S3_INTERNAL_ENDPOINT: "http://object-store:9000",
      S3_PUBLIC_ENDPOINT: "https://uploads.example.test",
      S3_REGION: "auto",
      S3_SECRET_KEY: "test-secret",
    });
    const signed = await presignIncomingUpload({
      bucket: config.bucket,
      checksumSha256Base64: "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=",
      client: createPublicPresigningClient(config),
      contentType: "image/jpeg",
      incomingObjectKey: buildIncomingObjectKey(uploadId),
    });
    const url = new URL(signed.url);

    expect(config.internalEndpoint).toBe("http://object-store:9000");
    expect(config.manageBucketCors).toBe(true);
    expect(url.origin).toBe("https://uploads.example.test");
    expect(signed.headers).toEqual({
      "content-type": "image/jpeg",
      "x-amz-checksum-sha256": "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=",
    });
    expect(url.searchParams.get("X-Amz-Expires")).toBe("600");
  });

  test("allows endpoint-managed CORS to disable bucket CORS mutation", () => {
    const config = readStorageConfig({
      S3_ACCESS_KEY: "test-access",
      S3_BUCKET: "rebuild-loop",
      S3_FORCE_PATH_STYLE: "true",
      S3_INTERNAL_ENDPOINT: "http://object-store:9000",
      S3_MANAGE_BUCKET_CORS: "false",
      S3_PUBLIC_ENDPOINT: "https://uploads.example.test",
      S3_REGION: "auto",
      S3_SECRET_KEY: "test-secret",
    });

    expect(config.manageBucketCors).toBe(false);
  });
});
