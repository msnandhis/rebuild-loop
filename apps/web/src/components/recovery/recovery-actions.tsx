"use client";

import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { primaryControl } from "../workspace/controls";

type RecoveryAction = "approve-plan";

const ACTION_COPY: Record<
  RecoveryAction,
  { busy: string; idle: string; success: string }
> = {
  "approve-plan": {
    busy: "Approving…",
    idle: "Approve recovery plan",
    success: "Approved",
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
          <Check aria-hidden="true" size={15} strokeWidth={1.75} />
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
          {error}
        </p>
      ) : null}
    </div>
  );
}
