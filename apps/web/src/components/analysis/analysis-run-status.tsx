"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type AnalysisStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
type AnalysisPhase =
  | "QUEUED"
  | "PREPARING_EVIDENCE"
  | "CALLING_MODEL"
  | "VALIDATING"
  | "PERSISTING"
  | "COMPLETE"
  | "FAILED";

interface AnalysisRecord {
  completedAt: string | null;
  createdAt: string;
  id: string;
  inputCount: number;
  model: string;
  phase: AnalysisPhase;
  promptVersion: string;
  retryable: boolean;
  safeErrorCode: string | null;
  safeErrorMessage: string | null;
  schemaVersion: string;
  startedAt: string | null;
  status: AnalysisStatus;
  updatedAt: string;
}

interface AnalysisStatusResponse {
  analysis: AnalysisRecord;
  correlationId: string;
}

const phases = [
  ["QUEUED", "Queued for inspection"],
  ["PREPARING_EVIDENCE", "Preparing evidence"],
  ["CALLING_MODEL", "Inspecting site images"],
  ["VALIDATING", "Validating observations"],
  ["PERSISTING", "Preparing candidate review"],
  ["COMPLETE", "Review ready"],
] as const;

export function AnalysisRunStatus({
  analysisId,
  projectId,
}: {
  analysisId: string;
  projectId: string;
}) {
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const response = await fetch(
          `/api/v1/projects/${encodeURIComponent(projectId)}/analyses/${encodeURIComponent(analysisId)}`,
          { cache: "no-store", credentials: "same-origin" },
        );
        const payload = (await response.json()) as
          | AnalysisStatusResponse
          | { error?: { message?: string }; message?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload
              ? (payload.error?.message ?? payload.message)
              : "Analysis status is temporarily unavailable.",
          );
        }
        if (stopped) {
          return;
        }

        const nextAnalysis = (payload as AnalysisStatusResponse).analysis;
        setAnalysis(nextAnalysis);
        setCorrelationId((payload as AnalysisStatusResponse).correlationId);
        setLoadError(null);

        if (
          nextAnalysis.status === "QUEUED" ||
          nextAnalysis.status === "RUNNING"
        ) {
          timer = window.setTimeout(() => void poll(), 2_000);
        }
      } catch {
        if (!stopped) {
          setLoadError(
            "Analysis status is temporarily unavailable. Processing may still be continuing.",
          );
        }
      }
    }

    void poll();
    return () => {
      stopped = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [analysisId, projectId, refreshVersion]);

  if (!analysis && !loadError) {
    return (
      <div
        aria-live="polite"
        className="flex min-h-48 items-center justify-center gap-3 border border-rule bg-paper text-sm text-ink-muted"
      >
        <LoaderCircle
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-none"
          size={19}
        />
        Loading durable analysis…
      </div>
    );
  }

  if (!analysis && loadError) {
    return (
      <div className="border-l-4 border-blocked bg-blocked-wash p-5 text-blocked">
        <div className="flex items-start gap-3">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={20}
          />
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Status could not be loaded
            </h2>
            <p className="mt-2 text-sm leading-6">{loadError}</p>
            <button
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              onClick={() => setRefreshVersion((value) => value + 1)}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} strokeWidth={1.75} />
              Try loading status again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const currentPhaseIndex = phases.findIndex(
    ([phase]) => phase === analysis.phase,
  );
  const terminal =
    analysis.status === "SUCCEEDED" || analysis.status === "FAILED";

  return (
    <div className="border border-rule bg-paper">
      <div className="border-b border-rule px-5 py-5 md:px-6">
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-evidence uppercase">
          Durable analysis / {analysis.id}
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold">
          {analysis.status === "SUCCEEDED"
            ? "Candidate review is ready."
            : analysis.status === "FAILED"
              ? "Analysis needs attention."
              : "Evidence analysis is in progress."}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
          {terminal
            ? `${analysis.inputCount} verified ${analysis.inputCount === 1 ? "image was" : "images were"} retained with this run.`
            : "You can leave this page. Processing continues in the background and this run remains available."}
        </p>
      </div>

      {loadError && (
        <div
          className="m-5 flex flex-wrap items-center justify-between gap-3 border-l-4 border-attention bg-attention-wash px-4 py-3 text-sm text-attention md:m-6"
          role="status"
        >
          <p>The last known status is shown. {loadError}</p>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => setRefreshVersion((value) => value + 1)}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={16} strokeWidth={1.75} />
            Reconnect
          </button>
        </div>
      )}

      {analysis.status === "FAILED" ? (
        <div className="m-5 border-l-4 border-blocked bg-blocked-wash p-4 md:m-6">
          <div className="flex items-start gap-3">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-blocked"
              size={20}
            />
            <div>
              <h3 className="font-semibold text-blocked">
                No proposals were published
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink">
                {analysis.safeErrorMessage ??
                  "The evidence could not be analysed safely. Return to capture and try again."}
              </p>
              {analysis.safeErrorCode && (
                <p className="mt-2 font-mono text-[11px] text-ink-muted">
                  Error {analysis.safeErrorCode}
                </p>
              )}
              {correlationId && (
                <p className="mt-1 font-mono text-[11px] text-ink-muted">
                  Reference {correlationId}
                </p>
              )}
              {analysis.retryable && (
                <p className="mt-3 text-sm leading-6 text-ink">
                  The verified images are retained. Return to evidence to start
                  a new analysis run.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <ol className="divide-y divide-rule">
          {phases.map(([phase, label], index) => {
            const complete =
              analysis.status === "SUCCEEDED" || index < currentPhaseIndex;
            const current = phase === analysis.phase;

            return (
              <li
                className="grid min-h-14 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 text-sm md:px-6"
                key={phase}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full border ${
                    complete
                      ? "border-verified bg-verified text-white"
                      : current
                        ? "border-evidence text-evidence"
                        : "border-rule text-ink-muted"
                  }`}
                >
                  {complete ? (
                    <Check aria-hidden="true" size={15} strokeWidth={2} />
                  ) : current ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin motion-reduce:animate-none"
                      size={15}
                    />
                  ) : (
                    <Circle aria-hidden="true" size={10} />
                  )}
                </span>
                <span
                  className={
                    current ? "font-semibold text-ink" : "text-ink-muted"
                  }
                >
                  {label}
                </span>
                <span className="font-mono text-[10px] text-ink-muted uppercase">
                  {complete ? "Complete" : current ? "In progress" : "Pending"}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-col-reverse justify-between gap-3 border-t border-rule px-5 py-5 sm:flex-row md:px-6">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-paper-subtle hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          href={`/projects/${projectId}/capture`}
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
          {analysis.status === "FAILED" && analysis.retryable
            ? "Start a new analysis"
            : "Back to evidence"}
        </Link>
        {analysis.status === "SUCCEEDED" && (
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-action bg-action px-5 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            href={`/projects/${projectId}/review`}
          >
            Inspect proposals
            <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
          </Link>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {analysis.status === "FAILED"
          ? "Analysis failed. No proposals were published."
          : analysis.status === "SUCCEEDED"
            ? "Analysis complete. Candidate review is ready."
            : `${phases[currentPhaseIndex]?.[1] ?? "Analysis in progress"}.`}
      </p>
    </div>
  );
}
