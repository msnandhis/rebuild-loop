export interface StorageConfig {
  accessKeyId: string;
  bucket: string;
  forcePathStyle: boolean;
  internalEndpoint: string;
  publicEndpoint: string;
  region: string;
  secretAccessKey: string;
}

function requireValue(input: NodeJS.ProcessEnv, name: string): string {
  const value = input[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function requireHttpUrl(input: NodeJS.ProcessEnv, name: string): string {
  const value = requireValue(input, name);
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} must use http or https`);
  }

  return url.toString().replace(/\/$/, "");
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error("S3_FORCE_PATH_STYLE must be true or false");
}

export function readStorageConfig(
  input: NodeJS.ProcessEnv = process.env,
): StorageConfig {
  return {
    accessKeyId: requireValue(input, "S3_ACCESS_KEY"),
    bucket: requireValue(input, "S3_BUCKET"),
    forcePathStyle: readBoolean(input.S3_FORCE_PATH_STYLE, true),
    internalEndpoint: requireHttpUrl(input, "S3_INTERNAL_ENDPOINT"),
    publicEndpoint: requireHttpUrl(input, "S3_PUBLIC_ENDPOINT"),
    region: requireValue(input, "S3_REGION"),
    secretAccessKey: requireValue(input, "S3_SECRET_KEY"),
  };
}
