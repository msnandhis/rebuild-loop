"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { secondaryControl } from "../workspace/controls";

export function RecoveryPlanPreparation({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<"error" | "pending">("pending");
  const [message, setMessage] = useState("");

  const prepare = useCallback(async () => {
    setMessage("");
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
          body?.error?.message ?? "The recovery plan could not be prepared.",
        );
      }
      router.refresh();
    } catch (caught) {
      setState("error");
      setMessage(
        caught instanceof Error
          ? caught.message
          : "The recovery plan could not be prepared.",
      );
    }
  }, [endpoint, router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void prepare();
  }, [prepare]);

  return (
    <div
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 border border-rule bg-paper px-4 py-3"
    >
      <div className="flex items-center gap-2.5">
        {state === "pending" ? (
          <LoaderCircle
            aria-hidden="true"
            className="animate-spin text-action motion-reduce:animate-none"
            size={17}
            strokeWidth={1.75}
          />
        ) : null}
        <div>
          <p className="text-sm font-semibold">
            {state === "pending"
              ? "Preparing the recovery plan"
              : "The plan needs attention"}
          </p>
          <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">
            {state === "pending"
              ? "Applying safety rules and updating the current plan."
              : message}
          </p>
        </div>
      </div>
      {state === "error" ? (
        <button className={secondaryControl} onClick={prepare} type="button">
          <RefreshCw aria-hidden="true" size={15} strokeWidth={1.75} />
          Try again
        </button>
      ) : null}
    </div>
  );
}
