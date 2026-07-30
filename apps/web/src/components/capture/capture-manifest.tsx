"use client";

import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileImage,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

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

  return (
    <section aria-labelledby="manifest-title" className="space-y-5">
      <div className="border border-rule bg-paper">
        <div className="border-b border-rule px-5 py-4 md:px-6">
          <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-evidence uppercase">
            Capture manifest / Initial survey
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className="font-heading text-xl font-semibold"
                id="manifest-title"
              >
                Add site images
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Each file is verified before it can be included in analysis.
              </p>
            </div>
            <p className="font-mono text-xs text-ink-muted">
              {readyCount} ready · {activeCount} processing · {availableSlots}{" "}
              slots open
            </p>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
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
          <p className="mt-3 text-xs leading-5 text-ink-muted">
            JPEG, PNG, or WebP · 10 MB each · six project images in this build
          </p>

          {selectionError && (
            <div
              className="mt-4 border-l-4 border-blocked bg-blocked-wash px-4 py-3 text-sm leading-6 text-blocked"
              role="alert"
            >
              {selectionError}
            </div>
          )}
        </div>
      </div>

      <div className="border border-rule bg-paper">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-4 md:px-6">
          <h2 className="font-heading text-lg font-semibold">
            Evidence in this project
          </h2>
          <button
            aria-label="Refresh evidence status"
            className="inline-flex size-11 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-paper-subtle hover:text-action disabled:cursor-wait disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
              size={18}
              strokeWidth={1.75}
            />
          </button>
        </div>

        {manifestError && (
          <div
            className="m-5 flex items-start gap-3 border-l-4 border-blocked bg-blocked-wash px-4 py-3 text-sm leading-6 text-blocked md:m-6"
            role="alert"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            <div>
              <p>{manifestError}</p>
              <button
                className="mt-2 min-h-11 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                onClick={() => void refreshMedia()}
                type="button"
              >
                Try loading evidence again
              </button>
            </div>
          </div>
        )}

        {isLoadingMedia && media.length === 0 && uploads.length === 0 ? (
          <div
            aria-live="polite"
            className="flex min-h-32 items-center justify-center gap-3 px-5 text-sm text-ink-muted"
          >
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
              size={18}
            />
            Loading evidence…
          </div>
        ) : media.length === 0 && uploads.length === 0 ? (
          <div className="px-5 py-9 text-center md:px-6">
            <UploadCloud
              aria-hidden="true"
              className="mx-auto text-ink-muted"
              size={25}
              strokeWidth={1.5}
            />
            <p className="mt-3 font-semibold">No evidence added yet.</p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Start with one clear overview, then add close-ups or labels.
            </p>
          </div>
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
      </div>

      {readyCount > 0 && (
        <div className="border border-verified/30 bg-verified-wash p-4">
          <div className="flex items-start gap-3 text-sm text-verified">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={19}
              strokeWidth={1.75}
            />
            <p>
              <span className="font-semibold">
                {readyCount} {readyCount === 1 ? "image is" : "images are"}{" "}
                ready.
              </span>{" "}
              {activeCount > 0
                ? `Wait for ${activeCount} remaining ${activeCount === 1 ? "upload" : "uploads"} before starting.`
                : "Start a durable analysis when this evidence set is complete."}
            </p>
          </div>
          <button
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-action bg-action px-5 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:w-auto"
            disabled={activeCount > 0 || isStartingAnalysis}
            onClick={() => void startAnalysis()}
            type="button"
          >
            {isStartingAnalysis && (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
                size={17}
              />
            )}
            {isStartingAnalysis
              ? "Starting analysis…"
              : `Analyse ${readyCount} ready ${readyCount === 1 ? "image" : "images"}`}
          </button>
          {analysisError && (
            <div
              className="mt-4 border-l-4 border-blocked bg-blocked-wash px-4 py-3 text-sm leading-6 text-blocked"
              role="alert"
            >
              <p>{analysisError.message}</p>
              {analysisError.correlationId && (
                <p className="mt-1 font-mono text-[11px]">
                  Reference {analysisError.correlationId}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {activeCount > 0
          ? `${activeCount} ${activeCount === 1 ? "upload is" : "uploads are"} processing.`
          : `${readyCount} ${readyCount === 1 ? "image is" : "images are"} ready for analysis.`}
      </p>
    </section>
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
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${
        disabled
          ? "cursor-not-allowed border-rule bg-paper-subtle text-ink-muted opacity-60"
          : "cursor-pointer border-action bg-paper text-action hover:bg-brand-wash"
      }`}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
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
    <li className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 px-5 py-4 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-center md:px-6">
      <div className="flex aspect-square items-center justify-center rounded-md border border-rule bg-paper-subtle text-ink-muted">
        <FileImage aria-hidden="true" size={22} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">
          {item.originalFilename}
        </p>
        <p className="mt-1 font-mono text-[11px] text-ink-muted">
          {item.id} · {formatBytes(item.actualBytes ?? item.expectedBytes)}
        </p>
        <p className={`mt-2 text-xs leading-5 ${status.className}`}>
          {status.label}
        </p>
      </div>
      <p className="col-start-2 font-mono text-[10px] text-ink-muted md:col-start-auto">
        Added{" "}
        {new Date(item.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
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
    <li className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 px-5 py-4 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-center md:px-6">
      <div className="relative aspect-square overflow-hidden rounded-md border border-rule bg-paper-subtle">
        <Image
          alt=""
          className="object-cover"
          fill
          sizes="72px"
          src={upload.previewUrl}
          unoptimized
        />
      </div>
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold">{upload.file.name}</p>
        <p className="mt-1 font-mono text-[11px] text-ink-muted">
          {formatBytes(upload.file.size)}
        </p>
        <p className={`mt-2 text-xs leading-5 ${status.className}`}>
          {status.label}
        </p>
        {upload.state === "UPLOADING" && (
          <progress
            aria-label={`Uploading ${upload.file.name}: ${upload.progress}%`}
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full accent-evidence"
            max={100}
            value={upload.progress}
          />
        )}
        {upload.error && (
          <p className="mt-1 text-xs leading-5 text-blocked" role="alert">
            {upload.error}
          </p>
        )}
      </div>
      {upload.state === "FAILED" && (
        <div className="col-start-2 flex flex-wrap gap-2 md:col-start-auto">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-action transition-colors hover:bg-brand-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={16} strokeWidth={1.75} />
            Retry
          </button>
          {!upload.assetId && (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-blocked transition-colors hover:bg-blocked-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              onClick={onRemove}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
              Remove
            </button>
          )}
        </div>
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
