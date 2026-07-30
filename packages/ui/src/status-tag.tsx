import type { ReactNode } from "react";

type StatusTone = "attention" | "blocked" | "evidence" | "neutral" | "verified";

const TONE_CLASS: Record<StatusTone, string> = {
  attention: "border-attention/30 bg-attention-wash text-attention",
  blocked: "border-blocked/30 bg-blocked-wash text-blocked",
  evidence: "border-evidence/30 bg-evidence-wash text-evidence",
  neutral: "border-rule bg-paper-subtle text-ink-muted",
  verified: "border-verified/30 bg-verified-wash text-verified",
};

export function StatusTag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}
