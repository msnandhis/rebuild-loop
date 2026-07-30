"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  FilePenLine,
  ImagePlus,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StatusTag } from "@rebuild/ui";

import { BrandMark } from "./brand-mark";

const stages = [
  { label: "Brief", state: "done" },
  { label: "Capture", state: "done" },
  { label: "Review", state: "current" },
  { label: "Ledger", state: "next" },
  { label: "Routes", state: "locked" },
  { label: "Pack", state: "locked" },
] as const;

const decisions = [
  {
    icon: Check,
    label: "Accept",
    value: "accepted",
  },
  {
    icon: FilePenLine,
    label: "Correct",
    value: "corrected",
  },
  {
    icon: ImagePlus,
    label: "Request evidence",
    value: "evidence",
  },
] as const;

type Decision = (typeof decisions)[number]["value"] | null;

export function ReviewWorkbench() {
  const [decision, setDecision] = useState<Decision>(null);
  const [isComplete, setIsComplete] = useState(false);

  function chooseDecision(value: Exclude<Decision, null>) {
    setDecision(value);
    setIsComplete(false);
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex min-h-14 max-w-[1440px] items-center justify-between gap-4 px-5 md:px-8">
          <Link
            aria-label="ReBuild Loop home"
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            href="/"
          >
            <BrandMark />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] text-ink-muted sm:inline">
              DEMO-001
            </span>
            <span
              aria-label="Demo user"
              className="flex size-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
            >
              AR
            </span>
          </div>
        </div>
      </header>

      <div className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-[1360px] px-5 pt-3 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold">North workshop</h1>
              <StatusTag tone="attention">3 to review</StatusTag>
            </div>
            <span className="hidden text-[12px] text-ink-muted sm:inline">
              Pre-demolition survey · Bristol
            </span>
          </div>
          <nav aria-label="Project stages" className="mt-1.5">
            <ol className="-mb-px flex overflow-x-auto">
              {stages.map((stage) => (
                <li key={stage.label}>
                  <span
                    aria-current={
                      stage.state === "current" ? "step" : undefined
                    }
                    className={`flex min-h-10 items-center gap-2 border-b-2 px-3 text-[12px] font-semibold whitespace-nowrap ${
                      stage.state === "current"
                        ? "border-action text-ink"
                        : stage.state === "locked"
                          ? "border-transparent text-ink-muted/55"
                          : "border-transparent text-ink-muted"
                    }`}
                  >
                    {stage.state === "done" ? (
                      <Check
                        aria-hidden="true"
                        className="text-verified"
                        size={13}
                        strokeWidth={2}
                      />
                    ) : stage.state === "locked" ? (
                      <Lock aria-hidden="true" size={11} strokeWidth={1.75} />
                    ) : stage.state === "current" ? (
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full bg-action"
                      />
                    ) : null}
                    {stage.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <main
        className="mx-auto max-w-[1360px] px-5 py-6 md:px-8"
        id="main-content"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.75} />
              Demo
            </Link>
            <span aria-hidden="true" className="text-rule-strong">
              /
            </span>
            <h2 className="text-[15px] font-semibold">
              Structural steel I-section
            </h2>
          </div>
          <span className="font-mono text-[11px] text-ink-muted">
            11 / 14 reviewed
          </span>
        </div>

        <div className="grid border border-rule bg-paper lg:grid-cols-[1.05fr_0.95fr]">
          <section
            aria-labelledby="evidence-title"
            className="border-b border-rule lg:border-r lg:border-b-0"
          >
            <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
              <h3 className="text-[13px] font-semibold" id="evidence-title">
                Source evidence
              </h3>
              <span className="font-mono text-[10px] text-ink-muted">
                IMG-128 · GRID B4
              </span>
            </div>
            <div className="bg-brand-black p-3 sm:p-4">
              <div className="ledger-grid aspect-[16/10] overflow-hidden border border-white/20 bg-[#292b33]">
                <svg
                  aria-label="Survey drawing of a steel frame with an evidence marker at the bolted connection"
                  className="h-full w-full"
                  fill="none"
                  role="img"
                  viewBox="0 0 640 400"
                >
                  <path
                    d="M82 340V70M282 340V70M482 340V70M62 340h440M82 92h400M82 215h400"
                    stroke="#D9DADE"
                    strokeWidth="8"
                  />
                  <path
                    d="M82 92 282 215 482 92M82 340l200-125 200 125"
                    stroke="#8B8D96"
                    strokeWidth="5"
                  />
                  <circle
                    cx="282"
                    cy="215"
                    fill="#fff"
                    r="23"
                    stroke="#FF0076"
                    strokeWidth="5"
                  />
                  <text
                    fill="#D00060"
                    fontFamily="monospace"
                    fontSize="16"
                    fontWeight="700"
                    textAnchor="middle"
                    x="282"
                    y="221"
                  >
                    14
                  </text>
                </svg>
              </div>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-rule border-t border-rule">
              <EvidenceFact label="Overview" value="IMG-128" />
              <EvidenceFact label="Steelwork" value="BOQ-41" />
              <EvidenceFact label="Measured" value="203 mm" />
            </dl>
          </section>

          <section aria-labelledby="proposal-title" className="flex flex-col">
            <div className="border-b border-rule px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold" id="proposal-title">
                  Proposed finding
                </h3>
                <StatusTag tone="attention">Needs decision</StatusTag>
              </div>
              <p className="mt-1 text-[13px] leading-5 text-ink-muted">
                Painted primary-frame member with a visible bolted connection.
              </p>
            </div>

            <dl className="grid sm:grid-cols-2">
              <ProposalFact label="Quantity" value="8 members · ~4.8 t" />
              <ProposalFact
                label="Condition"
                value="Worn coating · no distortion"
              />
              <ProposalFact label="Route" value="Direct reuse assessment" />
              <ProposalFact label="Evidence" value="Identity supported" />
            </dl>

            <details className="group border-y border-rule px-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-attention focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus">
                <ChevronRight
                  aria-hidden="true"
                  className="transition-transform group-open:rotate-90"
                  size={14}
                  strokeWidth={1.75}
                />
                3 unknowns before route approval
              </summary>
              <ul className="space-y-1 pb-4 pl-6 text-[13px] leading-5 text-ink-muted">
                <li>Connection close-up is missing.</li>
                <li>Section stamp is not transcribed.</li>
                <li>Coating status needs review.</li>
              </ul>
            </details>

            <div className="mt-auto p-4">
              <fieldset>
                <legend className="text-[13px] font-semibold">
                  Your decision
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {decisions.map(({ icon: Icon, label, value }) => {
                    const selected = decision === value;
                    return (
                      <button
                        aria-pressed={selected}
                        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                          selected
                            ? "border-action bg-brand-wash text-action"
                            : "border-rule bg-paper text-ink hover:border-rule-strong hover:bg-paper-subtle"
                        }`}
                        key={value}
                        onClick={() => chooseDecision(value)}
                        type="button"
                      >
                        <Icon aria-hidden="true" size={15} strokeWidth={1.75} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p
                  aria-live="polite"
                  className={`text-[12px] ${
                    isComplete
                      ? "font-semibold text-verified"
                      : "text-ink-muted"
                  }`}
                >
                  {isComplete
                    ? "Decision preview complete."
                    : "Demo only—nothing is saved."}
                </p>
                {isComplete ? (
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rule-strong bg-paper px-4 text-[13px] font-semibold transition-colors hover:border-ink hover:bg-paper-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    href="/"
                  >
                    Back to overview
                    <ArrowRight
                      aria-hidden="true"
                      size={15}
                      strokeWidth={1.75}
                    />
                  </Link>
                ) : (
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-action bg-action px-4 text-[13px] font-semibold text-white transition-colors hover:border-ink hover:bg-ink disabled:cursor-not-allowed disabled:border-rule disabled:bg-paper-subtle disabled:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    disabled={!decision}
                    onClick={() => setIsComplete(true)}
                    type="button"
                  >
                    Continue
                    <ArrowRight
                      aria-hidden="true"
                      size={15}
                      strokeWidth={1.75}
                    />
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function EvidenceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <dt className="text-[11px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-[11px] font-medium">
        {value}
      </dd>
    </div>
  );
}

function ProposalFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-rule px-4 py-2.5 odd:sm:border-r">
      <dt className="text-[11px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium">{value}</dd>
    </div>
  );
}
