"use client";

import { Check, FilePlus2, LoaderCircle, Route } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { primaryControl } from "../workspace/controls";

type RecoveryAction = "approve-plan" | "calculate-pathways" | "create-plan";

const ACTION_COPY: Record<
  RecoveryAction,
  { busy: string; idle: string; success: string }
> = {
  "approve-plan": {
    busy: "Approving…",
    idle: "Approve pack",
    success: "Approved",
  },
  "calculate-pathways": {
    busy: "Applying rules…",
    idle: "Calculate routes",
    success: "Calculated",
  },
  "create-plan": {
    busy: "Drafting…",
    idle: "Draft pack",
    success: "Drafted",
  },
};

export function RecoveryActionButton({
  action,
  disabled = false,
  endpoint,
}: {
  action: RecoveryAction;
  disabled?: boolean;
  endpoint: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "pending" | "success">("idle");
  const [error, setError] = useState("");
  const copy = ACTION_COPY[action];
  const Icon =
    action === "calculate-pathways"
      ? Route
      : action === "create-plan"
        ? FilePlus2
        : Check;

  async function run() {
    setError("");
    setState("pending");
    try {
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!response.ok) {
        throw new Error(
          body?.error?.message ?? "The request could not be completed.",
        );
      }
      setState("success");
      router.refresh();
    } catch (caught) {
      setState("idle");
      setError(
        caught instanceof Error
          ? caught.message
          : "The request could not be completed.",
      );
    }
  }

  return (
    <div>
      <button
        className={`${primaryControl} disabled:cursor-not-allowed disabled:border-rule disabled:bg-paper-subtle disabled:text-ink-muted`}
        disabled={disabled || state === "pending" || state === "success"}
        onClick={run}
        type="button"
      >
        {state === "pending" ? (
          <LoaderCircle
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
            size={15}
            strokeWidth={1.75}
          />
        ) : (
          <Icon aria-hidden="true" size={15} strokeWidth={1.75} />
        )}
        {state === "pending"
          ? copy.busy
          : state === "success"
            ? copy.success
            : copy.idle}
      </button>
      <p aria-live="polite" className="sr-only">
        {state === "success" ? copy.success : ""}
      </p>
      {error ? (
        <p
          className="mt-2 max-w-md text-sm leading-5 text-blocked"
          role="alert"
        >
          {error} Refresh the record and try again.
        </p>
      ) : null}
    </div>
  );
}
