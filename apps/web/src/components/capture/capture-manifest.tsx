"use client";

import {
  AlertCircle,
  Camera,
  FileImage,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { primaryControl, secondaryControl } from "../workspace/controls";
import { EmptyState } from "../workspace/empty-state";
import { Panel } from "../workspace/panel";
import { AnalysisClientError, startProjectAnalysis } from "./analysis-client";
import {
  completeProjectUpload,
  initiateProjectUpload,
  listProjectMedia,
  type MediaItem,
  sha256Hex,
  UploadClientError,
  uploadFileBytes,
} from "./upload-client";

const MAX_FILES = 6;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type LocalUploadState =
  "PREPARING" | "UPLOADING" | "VERIFYING" | "READY" | "FAILED";

interface LocalUpload {
  assetId?: string;
  error?: string | undefined;
  file: File;
  id: string;
  idempotencyKey: string;
  previewUrl: string;
  progress: number;
  session?: {
    expiresAt: string;
    headers: Record<string, string>;
    uploadId: string;
    uploadUrl: string;
  };
  state: LocalUploadState;
}

export function CaptureManifest({ projectId }: { projectId: string }) {
  const router = useRouter();
  const previewUrls = useRef(new Set<string>());
  const analysisRequest = useRef<{
    idempotencyKey: string;
    mediaKey: string;
  } | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<{
    correlationId?: string;
    message: string;
  } | null>(null);
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);

  useEffect(() => {
    let active = true;
    const mountedPreviewUrls = previewUrls.current;

    async function loadMedia() {
      try {
        const response = await listProjectMedia(projectId);
        if (active) {
          setMedia(response.items);
          setManifestError(null);
        }
      } catch (error) {
        if (active) {
          setManifestError(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoadingMedia(false);
        }
      }
    }

    void loadMedia();
    return () => {
      active = false;
      for (const previewUrl of mountedPreviewUrls) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [projectId]);

  useEffect(() => {
    const verificationPending =
      media.some((item) => item.status === "VERIFYING") ||
      uploads.some((upload) => upload.state === "VERIFYING");

    if (!verificationPending) {
      return;
    }

    const timer = window.setTimeout(() => {
      void refreshMedia();
    }, 2_000);

    return () => window.clearTimeout(timer);
  });

  const occupiedServerSlots = media.filter(
    (item) => item.status !== "REJECTED",
  ).length;
  const serverAssetIds = new Set(media.map((item) => item.id));
  const occupiedLocalSlots = uploads.filter(
    (upload) =>
      (upload.state !== "FAILED" || Boolean(upload.assetId)) &&
      (!upload.assetId || !serverAssetIds.has(upload.assetId)),
  ).length;
  const availableSlots = Math.max(
    0,
    MAX_FILES - occupiedServerSlots - occupiedLocalSlots,
  );
  const readyMediaIds = Array.from(
    new Set([
      ...media.filter((item) => item.status === "READY").map((item) => item.id),
      ...uploads
        .filter((upload) => upload.state === "READY" && Boolean(upload.assetId))
        .map((upload) => upload.assetId!),
    ]),
  );
  const readyCount = readyMediaIds.length;
  const activeCount =
    media.filter((item) => item.status === "VERIFYING").length +
    uploads.filter((upload) =>
      ["PREPARING", "UPLOADING", "VERIFYING"].includes(upload.state),
    ).length;
  const uploadControlsDisabled =
    isLoadingMedia || Boolean(manifestError) || availableSlots === 0;

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setSelectionError(null);

    if (selected.length === 0) {
      return;
    }
    if (selected.length > availableSlots) {
      setSelectionError(
        availableSlots === 0
          ? "This project already has six evidence images."
          : `Choose no more than ${availableSlots} additional ${availableSlots === 1 ? "image" : "images"}.`,
      );
      return;
    }

    const invalid = selected.find(
      (file) =>
        !ALLOWED_MIME_TYPES.has(file.type) || file.size > MAX_FILE_BYTES,
    );
    if (invalid) {
      setSelectionError(
        !ALLOWED_MIME_TYPES.has(invalid.type)
          ? `${invalid.name} is not a JPEG, PNG, or WebP image.`
          : `${invalid.name} exceeds the 10 MB file limit.`,
      );
      return;
    }

    for (const file of selected) {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      const entry: LocalUpload = {
        file,
        id: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
        previewUrl,
        progress: 0,
        state: "PREPARING",
      };
      setUploads((current) => [...current, entry]);
      void runUpload(entry);
    }
  }

  async function runUpload(entry: LocalUpload) {
    try {
      updateUpload(entry.id, {
        error: undefined,
        progress: 0,
        state: "PREPARING",
      });
      let session =
        entry.session &&
        new Date(entry.session.expiresAt).getTime() > Date.now()
          ? entry.session
          : undefined;

      if (!session) {
        const checksum = await sha256Hex(entry.file);
        const initiation = await initiateProjectUpload({
          checksum,
          file: entry.file,
          idempotencyKey: entry.idempotencyKey,
          projectId,
        });
        session = {
          expiresAt: initiation.expiresAt,
          headers: initiation.requiredHeaders,
          uploadId: initiation.uploadId,
          uploadUrl: initiation.uploadUrl,
        };
        updateUpload(entry.id, {
          assetId: initiation.assetId,
          session,
        });
      }

      updateUpload(entry.id, {
        state: "UPLOADING",
      });
      await uploadFileBytes({
        file: entry.file,
        headers: session.headers,
        onProgress: (uploadedBytes, totalBytes) => {
          updateUpload(entry.id, {
            progress: Math.min(
              100,
              Math.round((uploadedBytes / totalBytes) * 100),
            ),
          });
        },
        uploadUrl: session.uploadUrl,
      });
      updateUpload(entry.id, { progress: 100, state: "VERIFYING" });
      const completion = await completeProjectUpload({
        projectId,
        uploadId: session.uploadId,
      });
      updateUpload(entry.id, {
        assetId: completion.assetId,
        state: completion.status,
      });
      await refreshMedia();
    } catch (error) {
      updateUpload(entry.id, {
        error: getErrorMessage(error),
        state: "FAILED",
      });
    }
  }

  async function refreshMedia() {
    try {
      const response = await listProjectMedia(projectId);
      setMedia(response.items);
      setManifestError(null);
      const returnedIds = new Set(response.items.map((item) => item.id));
      setUploads((current) =>
        current.filter(
          (upload) =>
            !upload.assetId ||
            !returnedIds.has(upload.assetId) ||
            upload.state === "FAILED",
        ),
      );
    } catch (error) {
      setManifestError(getErrorMessage(error));
    }
  }

  function updateUpload(id: string, patch: Partial<LocalUpload>) {
    setUploads((current) =>
      current.map((upload) =>
        upload.id === id ? { ...upload, ...patch } : upload,
      ),
    );
  }

  function removeFailedUpload(upload: LocalUpload) {
    URL.revokeObjectURL(upload.previewUrl);
    previewUrls.current.delete(upload.previewUrl);
    setUploads((current) => current.filter((item) => item.id !== upload.id));
  }

  async function startAnalysis() {
    if (readyMediaIds.length === 0 || activeCount > 0) {
      return;
    }

    setAnalysisError(null);
    setIsStartingAnalysis(true);
    const mediaKey = [...readyMediaIds].sort().join(":");
    const request =
      analysisRequest.current?.mediaKey === mediaKey
        ? analysisRequest.current
        : {
            idempotencyKey: crypto.randomUUID(),
            mediaKey,
          };
    analysisRequest.current = request;

    try {
      const analysis = await startProjectAnalysis({
        idempotencyKey: request.idempotencyKey,
        mediaIds: readyMediaIds,
        projectId,
      });
      router.push(`/projects/${projectId}/analysis/${analysis.analysisId}`);
    } catch (error) {
      const correlationId =
        error instanceof AnalysisClientError ? error.correlationId : undefined;
      setAnalysisError({
        ...(correlationId ? { correlationId } : {}),
        message:
          error instanceof AnalysisClientError
            ? error.message
            : "Analysis could not be started. Your verified evidence is retained.",
      });
      setIsStartingAnalysis(false);
    }
  }

  const itemCount = media.length + uploads.length;

  return (
    <>
      <Panel
        actions={
          <button
            aria-label="Refresh evidence status"
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-paper-subtle hover:text-ink disabled:cursor-wait disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            disabled={isLoadingMedia}
            onClick={() => void refreshMedia()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={
                isLoadingMedia
                  ? "animate-spin motion-reduce:animate-none"
                  : undefined
              }
              size={16}
              strokeWidth={1.75}
            />
          </button>
        }
        meta={`${readyCount} ready · ${activeCount} processing · ${availableSlots} of ${MAX_FILES} slots open`}
        title="Site images"
        titleId="manifest-title"
      >
        <div className="border-b border-rule p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <UploadButton
              capture
              disabled={uploadControlsDisabled}
              icon={Camera}
              label="Take photos"
              onChange={handleFiles}
            />
            <UploadButton
              disabled={uploadControlsDisabled}
              icon={ImagePlus}
              label="Choose images"
              multiple
              onChange={handleFiles}
            />
          </div>
          <p className="mt-2 text-[12px] text-ink-muted">
            JPEG, PNG or WebP · 10 MB max
          </p>

          {selectionError && (
            <p
              className="mt-3 border-l-2 border-blocked bg-blocked-wash px-3 py-2 text-[13px] leading-5 text-blocked"
              role="alert"
            >
              {selectionError}
            </p>
          )}
        </div>

        {manifestError && (
          <div
            className="flex items-start gap-2 border-b border-rule bg-blocked-wash px-4 py-2.5 text-[13px] leading-5 text-blocked"
            role="alert"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={15}
            />
            <div>
              {manifestError}{" "}
              <button
                className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                onClick={() => void refreshMedia()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {isLoadingMedia && itemCount === 0 ? (
          <p
            aria-live="polite"
            className="flex items-center gap-2 px-4 py-6 text-sm text-ink-muted"
          >
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
              size={15}
            />
            Loading evidence…
          </p>
        ) : itemCount === 0 ? (
          <EmptyState>
            Add a wide view first, then the details that support a decision.
          </EmptyState>
        ) : (
          <ol className="divide-y divide-rule">
            {media.map((item) => (
              <ServerMediaRow item={item} key={item.id} />
            ))}
            {uploads.map((upload) => (
              <LocalUploadRow
                key={upload.id}
                onRemove={() => removeFailedUpload(upload)}
                onRetry={() => void runUpload(upload)}
                upload={upload}
              />
            ))}
          </ol>
        )}

        {readyCount > 0 && (
          <div className="border-t border-rule bg-paper-subtle px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px]">
                <span className="font-semibold">
                  {readyCount} {readyCount === 1 ? "image" : "images"} ready
                </span>
                {activeCount > 0 ? (
                  <span className="text-ink-muted">
                    {" · "}
                    {activeCount} still processing
                  </span>
                ) : null}
              </p>
              <button
                className={`${primaryControl} disabled:cursor-wait disabled:opacity-60`}
                disabled={activeCount > 0 || isStartingAnalysis}
                onClick={() => void startAnalysis()}
                type="button"
              >
                {isStartingAnalysis && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                    size={15}
                  />
                )}
                {isStartingAnalysis ? "Starting…" : "Start analysis"}
              </button>
            </div>
            {analysisError && (
              <p
                className="mt-2 border-l-2 border-blocked bg-blocked-wash px-3 py-2 text-[13px] leading-5 text-blocked"
                role="alert"
              >
                {analysisError.message}
                {analysisError.correlationId && (
                  <span className="mt-0.5 block font-mono text-[11px]">
                    Reference {analysisError.correlationId}
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </Panel>
      <p aria-live="polite" className="sr-only">
        {activeCount > 0
          ? `${activeCount} ${activeCount === 1 ? "upload is" : "uploads are"} processing.`
          : `${readyCount} ${readyCount === 1 ? "image is" : "images are"} ready for analysis.`}
      </p>
    </>
  );
}

function UploadButton({
  capture = false,
  disabled,
  icon: Icon,
  label,
  multiple = false,
  onChange,
}: {
  capture?: boolean;
  disabled: boolean;
  icon: typeof Camera;
  label: string;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      className={`${secondaryControl} focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${
        disabled
          ? "cursor-not-allowed border-rule bg-paper-subtle text-ink-muted"
          : "cursor-pointer"
      }`}
    >
      <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
      {label}
      <input
        accept="image/jpeg,image/png,image/webp"
        capture={capture ? "environment" : undefined}
        className="sr-only"
        disabled={disabled}
        multiple={multiple}
        onChange={onChange}
        type="file"
      />
    </label>
  );
}

function ServerMediaRow({ item }: { item: MediaItem }) {
  const status = getServerStatus(item);

  return (
    <li className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
      <div className="flex size-10 items-center justify-center rounded border border-rule bg-paper-subtle text-ink-muted">
        <FileImage aria-hidden="true" size={17} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">
          {item.originalFilename}
        </p>
        <p className="font-mono text-[11px] text-ink-muted tabular-nums">
          {formatBytes(item.actualBytes ?? item.expectedBytes)} ·{" "}
          {new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>
      <p className={`text-[12px] font-medium ${status.className}`}>
        {status.label}
      </p>
    </li>
  );
}

function LocalUploadRow({
  onRemove,
  onRetry,
  upload,
}: {
  onRemove: () => void;
  onRetry: () => void;
  upload: LocalUpload;
}) {
  const status = getLocalStatus(upload);

  return (
    <li className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
      <div className="relative size-10 overflow-hidden rounded border border-rule bg-paper-subtle">
        <Image
          alt=""
          className="object-cover"
          fill
          sizes="40px"
          src={upload.previewUrl}
          unoptimized
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">{upload.file.name}</p>
        <p className="font-mono text-[11px] text-ink-muted tabular-nums">
          {formatBytes(upload.file.size)}
        </p>
        {upload.state === "UPLOADING" && (
          <progress
            aria-label={`Uploading ${upload.file.name}: ${upload.progress}%`}
            className="mt-1 h-1 w-full overflow-hidden rounded-full accent-evidence"
            max={100}
            value={upload.progress}
          />
        )}
        {upload.error && (
          <p className="text-[12px] leading-5 text-blocked" role="alert">
            {upload.error}
          </p>
        )}
      </div>
      {upload.state === "FAILED" ? (
        <div className="flex items-center gap-1">
          <button
            aria-label={`Retry upload of ${upload.file.name}`}
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-paper-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={15} strokeWidth={1.75} />
          </button>
          {!upload.assetId && (
            <button
              aria-label={`Remove ${upload.file.name}`}
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-blocked-wash hover:text-blocked focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              onClick={onRemove}
              type="button"
            >
              <Trash2 aria-hidden="true" size={15} strokeWidth={1.75} />
            </button>
          )}
        </div>
      ) : (
        <p className={`text-[12px] font-medium ${status.className}`}>
          {status.label}
        </p>
      )}
    </li>
  );
}

function getServerStatus(item: MediaItem) {
  switch (item.status) {
    case "READY":
      return { className: "text-verified", label: "Ready for analysis" };
    case "VERIFYING":
      return { className: "text-evidence", label: "Verifying file…" };
    case "REJECTED":
      return {
        className: "text-blocked",
        label: item.rejectionCode
          ? `Rejected · ${formatRejectionCode(item.rejectionCode)}`
          : "Rejected by file verification",
      };
    default:
      return { className: "text-attention", label: "Upload incomplete" };
  }
}

function getLocalStatus(upload: LocalUpload) {
  switch (upload.state) {
    case "PREPARING":
      return { className: "text-evidence", label: "Preparing secure upload…" };
    case "UPLOADING":
      return {
        className: "text-evidence",
        label: `Uploading · ${upload.progress}%`,
      };
    case "VERIFYING":
      return { className: "text-evidence", label: "Verifying file…" };
    case "READY":
      return { className: "text-verified", label: "Ready for analysis" };
    case "FAILED":
      return { className: "text-blocked", label: "Upload needs attention" };
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof UploadClientError
    ? error.message
    : "The request could not be completed. Try again.";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRejectionCode(code: string): string {
  return code.toLowerCase().replaceAll("_", " ");
}
