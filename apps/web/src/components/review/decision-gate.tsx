"use client";

import {
  Check,
  CircleAlert,
  FilePenLine,
  LoaderCircle,
  MessageSquareMore,
  ShieldAlert,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import {
  recordDecision,
  requestClarification,
  type ReviewAction,
  ReviewClientError,
} from "./review-client";

interface CurrentDecision {
  action: ReviewAction;
  createdAt: string;
  reason: string;
}

interface DecisionGateProps {
  candidate: {
    materialFamily: string;
    observationSummary: string;
    preliminaryPathway: string;
    revisionId: string;
    subtype: string | null;
  };
  currentDecision: CurrentDecision | null;
  projectId: string;
  threadId: string;
}

const actions = [
  {
    action: "CONFIRMED",
    icon: Check,
    label: "Accept",
  },
  {
    action: "CORRECTED",
    icon: FilePenLine,
    label: "Correct",
  },
  {
    action: "EVIDENCE_REQUESTED",
    icon: MessageSquareMore,
    label: "Request evidence",
  },
  {
    action: "SPECIALIST_REVIEW",
    icon: ShieldAlert,
    label: "Send to specialist",
  },
  {
    action: "REJECTED",
    icon: X,
    label: "Reject",
  },
] as const;

export function DecisionGate({
  candidate,
  currentDecision,
  projectId,
  threadId,
}: DecisionGateProps) {
  const router = useRouter();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [selected, setSelected] = useState<ReviewAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{
    correlationId?: string;
    message: string;
  } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function choose(action: ReviewAction) {
    setSelected(action);
    setError(null);
    setSuccess(null);
    idempotencyKey.current = crypto.randomUUID();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    setError(null);
    setIsSubmitting(true);

    try {
      if (selected === "EVIDENCE_REQUESTED") {
        await requestClarification({
          idempotencyKey: idempotencyKey.current,
          instruction: String(form.get("instruction") ?? "").trim(),
          projectId,
          rationale: reason,
          requiredEvidence: String(
            form.get("requiredEvidence") ?? "CLOSE_UP",
          ) as "CLOSE_UP" | "LABEL" | "MEASUREMENT" | "CONTEXT",
          revisionId: candidate.revisionId,
          threadId,
        });
        setSuccess("Evidence request recorded and added to the field queue.");
      } else {
        const correctedValues =
          selected === "CORRECTED"
            ? {
                materialFamily: String(form.get("materialFamily") ?? ""),
                observationSummary: String(
                  form.get("observationSummary") ?? "",
                ).trim(),
                preliminaryPathway: String(
                  form.get("preliminaryPathway") ?? "",
                ),
                subtype: String(form.get("subtype") ?? "").trim() || null,
              }
            : undefined;
        await recordDecision({
          action: selected,
          ...(correctedValues ? { correctedValues } : {}),
          idempotencyKey: idempotencyKey.current,
          projectId,
          reason,
          revisionId: candidate.revisionId,
          threadId,
        });
        setSuccess(decisionSuccess(selected));
      }
      setSelected(null);
      idempotencyKey.current = crypto.randomUUID();
      router.refresh();
    } catch (caught) {
      setError({
        ...(caught instanceof ReviewClientError && caught.correlationId
          ? { correlationId: caught.correlationId }
          : {}),
        message:
          caught instanceof Error
            ? caught.message
            : "The decision could not be recorded. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      {currentDecision && (
        <div className="mb-4 border-l-2 border-verified bg-verified-wash px-3 py-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[13px] font-semibold text-verified">
              {decisionLabel(currentDecision.action)}
            </p>
            <time className="font-mono text-[10px] text-ink-muted">
              {formatDate(currentDecision.createdAt)}
            </time>
          </div>
          {currentDecision.reason && (
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              {currentDecision.reason}
            </p>
          )}
        </div>
      )}

      <fieldset>
        <legend className="text-[13px] font-semibold">Choose an action</legend>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {actions.map(({ action, icon: Icon, label }) => {
            const active = selected === action;
            return (
              <button
                aria-pressed={active}
                className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  active
                    ? "border-action bg-brand-wash"
                    : "border-rule bg-paper hover:border-rule-strong hover:bg-paper-subtle"
                }`}
                key={action}
                onClick={() => choose(action)}
                type="button"
              >
                <Icon
                  aria-hidden="true"
                  className={
                    action === "REJECTED" || action === "SPECIALIST_REVIEW"
                      ? "mt-0.5 shrink-0 text-blocked"
                      : "mt-0.5 shrink-0 text-action"
                  }
                  size={15}
                  strokeWidth={1.75}
                />
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {selected && (
        <form className="mt-4 border-t border-rule pt-4" onSubmit={submit}>
          {selected === "CORRECTED" && (
            <CorrectionFields candidate={candidate} />
          )}
          {selected === "EVIDENCE_REQUESTED" && <ClarificationFields />}

          <label
            className="mt-4 block text-sm font-semibold"
            htmlFor="decision-reason"
          >
            {selected === "CONFIRMED"
              ? "Review note (optional)"
              : selected === "EVIDENCE_REQUESTED"
                ? "Why this evidence changes the decision"
                : "Reason"}
          </label>
          <textarea
            aria-describedby="decision-reason-help"
            className="mt-2 min-h-20 w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            defaultValue=""
            id="decision-reason"
            maxLength={500}
            name="reason"
            required={selected !== "CONFIRMED"}
          />
          <p className="sr-only" id="decision-reason-help">
            This note is stored in the audit trail.
          </p>

          {error && (
            <div
              className="mt-4 border-l-4 border-blocked bg-blocked-wash px-3 py-3 text-sm text-blocked"
              role="alert"
            >
              <p>{error.message}</p>
              {error.correlationId && (
                <p className="mt-1 font-mono text-[10px]">
                  Reference {error.correlationId}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-rule-strong bg-paper px-4 text-sm font-semibold transition-colors hover:bg-paper-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              disabled={isSubmitting}
              onClick={() => setSelected(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-action bg-action px-4 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting && (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                  size={16}
                />
              )}
              {isSubmitting ? "Recording…" : "Record action"}
            </button>
          </div>
        </form>
      )}

      <div aria-live="polite" className="mt-4">
        {success && (
          <p className="border-l-4 border-verified bg-verified-wash px-3 py-3 text-sm text-verified">
            {success}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-rule pt-3 text-[11px] leading-4 text-ink-muted">
        <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
        <p>
          Acceptance records a review decision; it is not material
          certification.
        </p>
      </div>
    </div>
  );
}

function CorrectionFields({ candidate }: Pick<DecisionGateProps, "candidate">) {
  return (
    <div className="space-y-4">
      <div>
        <label
          className="block text-sm font-semibold"
          htmlFor="corrected-observation"
        >
          Corrected observation
        </label>
        <textarea
          className="mt-2 min-h-28 w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          defaultValue={candidate.observationSummary}
          id="corrected-observation"
          maxLength={1000}
          name="observationSummary"
          required
        />
      </div>
      <div>
        <label
          className="block text-sm font-semibold"
          htmlFor="corrected-subtype"
        >
          Material subtype
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-rule-strong bg-paper px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          defaultValue={candidate.subtype ?? ""}
          id="corrected-subtype"
          maxLength={120}
          name="subtype"
        />
      </div>
      <div>
        <label
          className="block text-sm font-semibold"
          htmlFor="corrected-family"
        >
          Material family
        </label>
        <select
          className="mt-2 min-h-11 w-full rounded-md border border-rule-strong bg-paper px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          defaultValue={candidate.materialFamily}
          id="corrected-family"
          name="materialFamily"
        >
          {[
            "CONCRETE",
            "BRICK",
            "STEEL",
            "TIMBER",
            "GLASS",
            "ALUMINIUM",
            "FIXTURES",
            "OTHER",
          ].map((value) => (
            <option key={value} value={value}>
              {humanize(value)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          className="block text-sm font-semibold"
          htmlFor="corrected-pathway"
        >
          Preliminary pathway
        </label>
        <select
          className="mt-2 min-h-11 w-full rounded-md border border-rule-strong bg-paper px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          defaultValue={candidate.preliminaryPathway}
          id="corrected-pathway"
          name="preliminaryPathway"
        >
          {[
            "SAME_SITE_REUSE",
            "DIRECT_REUSE",
            "RECYCLE",
            "SPECIALIST_REVIEW",
            "RESIDUAL",
            "UNKNOWN",
          ].map((value) => (
            <option key={value} value={value}>
              {humanize(value)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ClarificationFields() {
  return (
    <div className="space-y-4">
      <div>
        <label
          className="block text-sm font-semibold"
          htmlFor="clarification-instruction"
        >
          Field instruction
        </label>
        <textarea
          aria-describedby="clarification-instruction-help"
          className="mt-2 min-h-28 w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          id="clarification-instruction"
          maxLength={500}
          name="instruction"
          placeholder="Example: Photograph the complete fire-rating label square-on, close enough for every character to be legible."
          required
        />
        <p
          className="mt-1 text-xs leading-5 text-ink-muted"
          id="clarification-instruction-help"
        >
          Ask for one specific, collectible observation.
        </p>
      </div>
      <div>
        <label
          className="block text-sm font-semibold"
          htmlFor="required-evidence"
        >
          Evidence type
        </label>
        <select
          className="mt-2 min-h-11 w-full rounded-md border border-rule-strong bg-paper px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          defaultValue="CLOSE_UP"
          id="required-evidence"
          name="requiredEvidence"
        >
          <option value="CLOSE_UP">Close-up</option>
          <option value="LABEL">Label or marking</option>
          <option value="MEASUREMENT">Measurement</option>
          <option value="CONTEXT">Wider context</option>
        </select>
      </div>
    </div>
  );
}

function decisionLabel(action: ReviewAction) {
  return (
    actions.find((item) => item.action === action)?.label ?? humanize(action)
  );
}

function decisionSuccess(action: ReviewAction) {
  if (action === "CONFIRMED") return "Observation accepted.";
  if (action === "CORRECTED") return "Correction recorded.";
  if (action === "REJECTED") return "Proposal rejected.";
  return "Specialist review recorded.";
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
