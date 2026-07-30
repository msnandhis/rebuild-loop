import { createHash, createHmac } from "node:crypto";

import type { StorageClient } from "./client.js";

const algorithm = "AWS4-HMAC-SHA256";

export function objectUrl(
  client: StorageClient,
  bucket: string,
  key = "",
): URL {
  const base = new URL(client.endpoint);
  const keySegments = key.split("/").filter(Boolean).map(encodeRfc3986);
  const encoded = [
    ...(client.config.forcePathStyle ? [bucket] : []),
    ...keySegments,
  ]
    .filter(Boolean)
    .join("/");
  if (!client.config.forcePathStyle) {
    base.hostname = `${bucket}.${base.hostname}`;
  }
  base.pathname = `${base.pathname.replace(/\/$/, "")}/${encoded}`;
  return base;
}

export function presignRequest(input: {
  client: StorageClient;
  expiresInSeconds: number;
  headers?: Record<string, string>;
  method: string;
  url: URL;
}): string {
  const now = new Date();
  const { amzDate, dateStamp } = formatDate(now);
  const scope = `${dateStamp}/${input.client.config.region}/s3/aws4_request`;
  const headers = normalizeHeaders({
    host: input.url.host,
    ...(input.headers ?? {}),
  });
  const signedHeaders = Object.keys(headers).sort().join(";");

  input.url.searchParams.set("X-Amz-Algorithm", algorithm);
  input.url.searchParams.set(
    "X-Amz-Credential",
    `${input.client.config.accessKeyId}/${scope}`,
  );
  input.url.searchParams.set("X-Amz-Date", amzDate);
  input.url.searchParams.set("X-Amz-Expires", String(input.expiresInSeconds));
  input.url.searchParams.set("X-Amz-SignedHeaders", signedHeaders);

  const canonicalRequest = [
    input.method,
    input.url.pathname,
    canonicalQuery(input.url),
    canonicalHeaders(headers),
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    algorithm,
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const signingKey = deriveKey(
    input.client.config.secretAccessKey,
    dateStamp,
    input.client.config.region,
  );
  const signature = hmac(signingKey, stringToSign).toString("hex");
  input.url.searchParams.set("X-Amz-Signature", signature);
  return input.url.toString();
}

export async function signedFetch(input: {
  body?: string;
  client: StorageClient;
  headers?: Record<string, string>;
  method: string;
  url: URL;
}): Promise<Response> {
  const { amzDate, dateStamp } = formatDate(new Date());
  const bodyHash =
    typeof input.body === "string" || Buffer.isBuffer(input.body)
      ? sha256(input.body)
      : sha256("");
  const headers = normalizeHeaders({
    host: input.url.host,
    "x-amz-content-sha256": bodyHash,
    "x-amz-date": amzDate,
    ...(input.headers ?? {}),
  });
  const signedHeaders = Object.keys(headers).sort().join(";");
  const scope = `${dateStamp}/${input.client.config.region}/s3/aws4_request`;
  const canonicalRequest = [
    input.method,
    input.url.pathname,
    canonicalQuery(input.url),
    canonicalHeaders(headers),
    signedHeaders,
    bodyHash,
  ].join("\n");
  const stringToSign = [
    algorithm,
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const signature = hmac(
    deriveKey(
      input.client.config.secretAccessKey,
      dateStamp,
      input.client.config.region,
    ),
    stringToSign,
  ).toString("hex");

  return fetch(input.url, {
    ...(input.body === undefined ? {} : { body: input.body }),
    headers: {
      ...headers,
      authorization: `${algorithm} Credential=${input.client.config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    method: input.method,
  });
}

function formatDate(date: Date) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function normalizeHeaders(
  input: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key.toLowerCase(),
      value.trim().replace(/\s+/g, " "),
    ]),
  );
}

function canonicalHeaders(headers: Record<string, string>): string {
  return Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}\n`)
    .join("");
}

function canonicalQuery(url: URL): string {
  return [...url.searchParams.entries()]
    .map(([key, value]) => [encodeRfc3986(key), encodeRfc3986(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey === rightKey
        ? leftValue.localeCompare(rightValue)
        : leftKey.localeCompare(rightKey),
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: string | Buffer, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function deriveKey(secret: string, date: string, region: string): Buffer {
  const dateKey = hmac(`AWS4${secret}`, date);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}
