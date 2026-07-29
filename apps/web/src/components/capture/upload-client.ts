export type MediaStatus = "PENDING_UPLOAD" | "VERIFYING" | "READY" | "REJECTED";

export interface MediaItem {
  actualBytes: number | null;
  createdAt: string;
  declaredMime: string;
  detectedMime: string | null;
  expectedBytes: number;
  id: string;
  originalFilename: string;
  readyAt: string | null;
  rejectionCode: string | null;
  status: MediaStatus;
}

interface MediaResponse {
  correlationId: string;
  items: MediaItem[];
}

interface InitiateUploadResponse {
  assetId: string;
  correlationId: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
  uploadId: string;
  uploadUrl: string;
}

interface CompleteUploadResponse {
  assetId: string;
  correlationId: string;
  status: "VERIFYING" | "READY";
}

interface ApiErrorShape {
  error?: { message?: string };
  message?: string;
}

export async function listProjectMedia(
  projectId: string,
): Promise<MediaResponse> {
  const response = await fetch(
    `/api/v1/projects/${encodeURIComponent(projectId)}/media`,
    { cache: "no-store", credentials: "same-origin" },
  );
  return readJsonResponse<MediaResponse>(response);
}

export async function initiateProjectUpload(input: {
  checksum: string;
  file: File;
  idempotencyKey: string;
  projectId: string;
}): Promise<InitiateUploadResponse> {
  const response = await fetch(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/uploads/initiate`,
    {
      body: JSON.stringify({
        clientChecksum: input.checksum,
        declaredMime: input.file.type,
        expectedBytes: input.file.size,
        filename: input.file.name,
      }),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      method: "POST",
    },
  );
  return readJsonResponse<InitiateUploadResponse>(response);
}

export function uploadFileBytes(input: {
  file: File;
  headers: Record<string, string>;
  onProgress: (uploadedBytes: number, totalBytes: number) => void;
  uploadUrl: string;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", input.uploadUrl);

    for (const [name, value] of Object.entries(input.headers)) {
      request.setRequestHeader(name, value);
    }

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        input.onProgress(event.loaded, event.total);
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new UploadClientError("The storage service rejected the upload."));
    });
    request.addEventListener("error", () => {
      reject(
        new UploadClientError(
          "The upload was interrupted. Check your connection and retry.",
        ),
      );
    });
    request.addEventListener("timeout", () => {
      reject(
        new UploadClientError(
          "The upload timed out. Check your connection and retry.",
        ),
      );
    });
    request.send(input.file);
  });
}

export async function completeProjectUpload(input: {
  projectId: string;
  uploadId: string;
}): Promise<CompleteUploadResponse> {
  const response = await fetch(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/uploads/${encodeURIComponent(input.uploadId)}/complete`,
    {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
  return readJsonResponse<CompleteUploadResponse>(response);
}

export async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export class UploadClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadClientError";
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new UploadClientError(
      response.ok
        ? "The server returned an unreadable response."
        : "The request could not be completed. Try again.",
    );
  }

  if (!response.ok) {
    const candidate = payload as ApiErrorShape;
    throw new UploadClientError(
      candidate.error?.message ??
        candidate.message ??
        "The request could not be completed. Try again.",
    );
  }

  return payload as T;
}
