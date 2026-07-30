const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha256Pattern = /^[0-9a-f]{64}$/;

function requireUuid(value: string, name: string): string {
  if (!uuidPattern.test(value)) {
    throw new Error(`${name} must be a UUID`);
  }

  return value.toLowerCase();
}

export function buildIncomingObjectKey(uploadSessionId: string): string {
  return `incoming/${requireUuid(uploadSessionId, "uploadSessionId")}`;
}

export function buildFinalObjectKey(input: {
  mediaAssetId: string;
  projectId: string;
  sha256: string;
}): string {
  if (!sha256Pattern.test(input.sha256)) {
    throw new Error("sha256 must be a lowercase hexadecimal digest");
  }

  return [
    "projects",
    requireUuid(input.projectId, "projectId"),
    "assets",
    requireUuid(input.mediaAssetId, "mediaAssetId"),
    input.sha256,
  ].join("/");
}

export function encodeCopySource(bucket: string, objectKey: string): string {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${encodedBucket}/${encodedKey}`;
}
