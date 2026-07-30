"use client";

import { Camera, CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState } from "react";

import {
  completeProjectUpload,
  initiateProjectUpload,
  listProjectMedia,
  sha256Hex,
  uploadFileBytes,
} from "../capture/upload-client";
import { submitClarification } from "./review-client";

interface ClarificationTaskProps {
  instruction: string;
  projectId: string;
  rationale: string;
  requiredEvidence: string;
  status: string;
  taskId: string;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ClarificationTask({
  instruction,
  projectId,
  rationale,
  requiredEvidence,
  status,
  taskId,
}: ClarificationTaskProps) {
  const router = useRouter();
  const submissionKey = useRef(crypto.randomUUID());
  const [phase, setPhase] = useState<
    "IDLE" | "UPLOADING" | "VERIFYING" | "STARTING_ANALYSIS" | "DONE"
  >("IDLE");
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("The image must be no larger than 10 MB.");
      return;
    }

    setFilename(file.name);
    setPhase("UPLOADING");
    setProgress(0);
    try {
      const initiation = await initiateProjectUpload({
        checksum: await sha256Hex(file),
        file,
        idempotencyKey: crypto.randomUUID(),
        projectId,
      });
      await uploadFileBytes({
        file,
        headers: initiation.requiredHeaders,
        onProgress: (uploaded, total) =>
          setProgress(Math.round((uploaded / total) * 100)),
        uploadUrl: initiation.uploadUrl,
      });
      setPhase("VERIFYING");
      await completeProjectUpload({
        projectId,
        uploadId: initiation.uploadId,
      });
      await waitUntilReady(projectId, initiation.assetId);
      setPhase("STARTING_ANALYSIS");
      const result = await submitClarification({
        idempotencyKey: submissionKey.current,
        mediaIds: [initiation.assetId],
        projectId,
        taskId,
      });
      setPhase("DONE");
      router.push(`/projects/${projectId}/analysis/${result.analysisId}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The evidence could not be submitted. Try again.",
      );
      setPhase("IDLE");
    }
  }

  if (status !== "OPEN") {
    return (
      <section className="border border-rule bg-paper px-4 py-4">
        <p className="font-mono text-[10px] text-verified uppercase">
          Clarification / {humanize(status)}
        </p>
        <p className="mt-2 text-sm font-semibold">{instruction}</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          {status === "ACCEPTED"
            ? "The re-analysis incorporated this evidence."
            : "Evidence has been submitted and is awaiting re-analysis."}
        </p>
      </section>
    );
  }

  const busy = phase !== "IDLE";
  return (
    <section
      aria-labelledby={`clarification-${taskId}`}
      className="border border-attention bg-attention-wash/40"
    >
      <div className="border-b border-attention px-4 py-3">
        <p className="font-mono text-[10px] text-attention uppercase">
          Open evidence request / {humanize(requiredEvidence)}
        </p>
        <h3 className="mt-1 text-sm font-bold" id={`clarification-${taskId}`}>
          {instruction}
        </h3>
      </div>
      <div className="px-4 py-4">
        <p className="text-xs leading-5 text-ink-muted">{rationale}</p>
        <label
          className={`mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-action bg-paper px-4 text-sm font-semibold text-action transition-colors hover:bg-brand-wash focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${
            busy ? "cursor-wait opacity-60" : ""
          }`}
        >
          {busy ? (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
              size={18}
            />
          ) : (
            <Camera aria-hidden="true" size={18} strokeWidth={1.75} />
          )}
          <span>{phaseLabel(phase, progress)}</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            disabled={busy}
            onChange={(event) => void handleFile(event)}
            type="file"
          />
        </label>
        {filename && busy && (
          <p className="mt-2 truncate text-xs text-ink-muted">{filename}</p>
        )}
        {error && (
          <div
            className="mt-3 flex gap-2 border-l-4 border-blocked bg-blocked-wash px-3 py-2 text-xs leading-5 text-blocked"
            role="alert"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={15}
            />
            <p>{error}</p>
          </div>
        )}
        <p aria-live="polite" className="sr-only">
          {phase === "DONE"
            ? "Clarification evidence submitted. Re-analysis started."
            : busy
              ? phaseLabel(phase, progress)
              : ""}
        </p>
      </div>
    </section>
  );
}

async function waitUntilReady(projectId: string, mediaId: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await listProjectMedia(projectId);
    const item = result.items.find((media) => media.id === mediaId);
    if (item?.status === "READY") return;
    if (item?.status === "REJECTED") {
      throw new Error(
        "Server verification rejected this image. Choose another image.",
      );
    }
    await new Promise((resolve) => window.setTimeout(resolve, 2_000));
  }
  throw new Error(
    "Verification is taking longer than expected. The upload is retained; return to this task and try again.",
  );
}

function phaseLabel(
  phase: "IDLE" | "UPLOADING" | "VERIFYING" | "STARTING_ANALYSIS" | "DONE",
  progress: number,
) {
  if (phase === "UPLOADING") return `Uploading ${progress}%`;
  if (phase === "VERIFYING") return "Verifying evidence…";
  if (phase === "STARTING_ANALYSIS") return "Starting re-analysis…";
  if (phase === "DONE") return "Evidence submitted";
  return "Capture requested evidence";
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
