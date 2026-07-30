import type { StorageConfig } from "./config.js";

export interface StorageClient {
  config: StorageConfig;
  endpoint: string;
}

function createClient(config: StorageConfig, endpoint: string): StorageClient {
  return { config, endpoint };
}

export function createInternalS3Client(config: StorageConfig): StorageClient {
  return createClient(config, config.internalEndpoint);
}

export function createPublicPresigningClient(
  config: StorageConfig,
): StorageClient {
  return createClient(config, config.publicEndpoint);
}
