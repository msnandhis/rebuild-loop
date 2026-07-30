import type { StorageClient } from "./client.js";
import { objectUrl, signedFetch } from "./signature.js";

export async function headObject(
  client: StorageClient,
  bucket: string,
  key: string,
) {
  const response = await signedFetch({
    client,
    method: "HEAD",
    url: objectUrl(client, bucket, key),
  });
  if (!response.ok) {
    throw new Error(`Object head failed with status ${response.status}`);
  }
  return {
    bytes: Number(response.headers.get("content-length") ?? "0"),
    etag: response.headers.get("etag") ?? undefined,
    versionId: response.headers.get("x-amz-version-id") ?? undefined,
  };
}

export async function getObjectBytes(
  client: StorageClient,
  bucket: string,
  key: string,
  versionId?: string,
): Promise<Buffer> {
  const url = objectUrl(client, bucket, key);
  if (versionId) {
    url.searchParams.set("versionId", versionId);
  }
  const response = await signedFetch({ client, method: "GET", url });
  if (!response.ok) {
    throw new Error(`Object read failed with status ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteObject(
  client: StorageClient,
  bucket: string,
  key: string,
): Promise<void> {
  const response = await signedFetch({
    client,
    method: "DELETE",
    url: objectUrl(client, bucket, key),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Object delete failed with status ${response.status}`);
  }
}

export async function ensurePrivateBucket(
  client: StorageClient,
  bucket: string,
  allowedOrigin: string,
): Promise<void> {
  const bucketUrl = objectUrl(client, bucket);
  let response = await signedFetch({
    client,
    method: "HEAD",
    url: bucketUrl,
  });
  if (response.status === 404) {
    response = await signedFetch({
      client,
      method: "PUT",
      url: bucketUrl,
    });
  }
  if (!response.ok) {
    throw new Error(`Object bucket is unavailable (${response.status})`);
  }

  if (!client.config.manageBucketCors) {
    return;
  }

  const corsUrl = objectUrl(client, bucket);
  corsUrl.searchParams.set("cors", "");
  const cors = `<CORSConfiguration><CORSRule><AllowedOrigin>${escapeXml(allowedOrigin)}</AllowedOrigin><AllowedMethod>PUT</AllowedMethod><AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedHeader>content-type</AllowedHeader><AllowedHeader>x-amz-checksum-sha256</AllowedHeader><ExposeHeader>etag</ExposeHeader><MaxAgeSeconds>600</MaxAgeSeconds></CORSRule></CORSConfiguration>`;
  response = await signedFetch({
    body: cors,
    client,
    headers: { "content-type": "application/xml" },
    method: "PUT",
    url: corsUrl,
  });
  if (!response.ok) {
    throw new Error(`Object bucket CORS could not be set (${response.status})`);
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
