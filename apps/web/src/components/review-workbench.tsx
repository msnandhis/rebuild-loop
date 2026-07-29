"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  FileText,
  ImageIcon,
  Menu,
  RotateCcw,
  Ruler,
  X,
} from "lucide-react";
import Link from "next/link";

import { StatusTag } from "@rebuild/ui";

import { BrandMark } from "./brand-mark";

const stages = [
  ["1", "Site brief", "done"],
  ["2", "Capture", "done"],
  ["3", "Review", "current"],
  ["4", "Materials ledger", "pending"],
  ["5", "Recovery routes", "blocked"],
  ["6", "Recovery pack", "blocked"],
] as const;

type Decision = "accepted" | "corrected" | "evidence" | null;

export function ReviewWorkbench() {
  const [decision, setDecision] = useState<Decision>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-rule bg-paper">
        <div className="flex min-h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle project stages"
              className="inline-flex size-11 items-center justify-center rounded-md border border-rule text-ink md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              type="button"
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" size={20} />
              ) : (
                <Menu aria-hidden="true" size={20} />
              )}
            </button>
            <Link
              aria-label="Back to ReBuild Loop home"
              className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
              href="/"
            >
              <BrandMark />
            </Link>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="font-mono text-xs text-ink-muted">DEMO-001</span>
            <span className="h-5 w-px bg-rule" />
            <span className="text-sm font-semibold">North workshop</span>
          </div>
          <div
            aria-label="Demo user"
            className="flex size-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
          >
            AR
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-65px)] md:grid-cols-[240px_1fr]">
        <aside
          className={`${mobileMenuOpen ? "block" : "hidden"} border-r border-rule bg-paper md:block`}
        >
          <div className="border-b border-rule p-5">
            <Link
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted hover:text-action"
              href="/"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              All projects
            </Link>
            <h1 className="mt-4 font-heading text-xl font-bold">
              North workshop
            </h1>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              Pre-demolition survey · Bristol
            </p>
          </div>
          <nav aria-label="Project stages" className="p-3">
            <ol className="space-y-1">
              {stages.map(([number, title, state]) => {
                const stageContent = (
                  <>
                    <span
                      className={`flex size-6 items-center justify-center rounded-full border font-mono text-[10px] ${
                        state === "done"
                          ? "border-verified bg-verified text-white"
                          : state === "current"
                            ? "border-action text-action"
                            : "border-rule text-ink-muted"
                      }`}
                    >
                      {state === "done" ? (
                        <Check aria-hidden="true" size={13} />
                      ) : (
                        number
                      )}
                    </span>
                    {title}
                    {state === "current" && (
                      <ChevronRight aria-hidden="true" size={15} />
                    )}
                  </>
                );
                const stageClass = `grid min-h-11 grid-cols-[28px_1fr_auto] items-center gap-2 rounded-md px-2 text-sm ${
                  state === "current"
                    ? "bg-brand-wash font-semibold text-action"
                    : state === "blocked"
                      ? "text-ink-muted/65"
                      : "text-ink-muted"
                }`;

                return (
                  <li key={number}>
                    {state === "current" ? (
                      <a
                        aria-current="step"
                        className={stageClass}
                        href="#review-item"
                      >
                        {stageContent}
                      </a>
                    ) : (
                      <span
                        aria-disabled={state === "blocked" ? "true" : undefined}
                        className={stageClass}
                      >
                        {stageContent}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="mx-3 mt-6 border border-attention/30 bg-attention-wash p-3 text-xs leading-5 text-attention">
            <p className="font-semibold">Why stages are blocked</p>
            <p className="mt-1">
              Review 3 remaining candidates before recovery routes can open.
            </p>
          </div>
        </aside>

        <main className="min-w-0" id="main-content">
          <div className="border-b border-rule bg-paper px-4 py-5 md:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs font-medium tracking-[0.12em] text-action uppercase">
                    Candidate review
                  </p>
                  <StatusTag tone="attention">3 remaining</StatusTag>
                </div>
                <h2 className="mt-2 font-heading text-2xl font-bold tracking-[-0.03em] md:text-3xl">
                  Review material candidate 14
                </h2>
              </div>
              <p className="font-mono text-xs text-ink-muted">
                11 of 14 reviewed
              </p>
            </div>
            <div
              aria-label="Review progress: 11 of 14 candidates"
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-subtle"
              role="progressbar"
              aria-valuemax={14}
              aria-valuemin={0}
              aria-valuenow={11}
            >
              <div className="h-full w-[78.5%] bg-brand" />
            </div>
          </div>

          <div
            className="grid min-h-[calc(100vh-174px)] xl:grid-cols-[minmax(360px,1.35fr)_minmax(320px,1fr)_minmax(280px,0.72fr)]"
            id="review-item"
          >
            <section
              aria-labelledby="evidence-title"
              className="border-b border-rule bg-brand-black p-4 text-white xl:border-r xl:border-b-0 md:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.12em] text-white/55 uppercase">
                    Evidence IMG-128
                  </p>
                  <h3
                    className="mt-1 font-heading text-lg font-semibold"
                    id="evidence-title"
                  >
                    Grid B4 · Primary frame
                  </h3>
                </div>
                <StatusTag tone="evidence">Source image</StatusTag>
              </div>
              <div className="ledger-grid relative mt-5 aspect-[4/3] overflow-hidden border border-white/25 bg-[#292B33]">
                <svg
                  aria-label="Survey drawing showing a steel frame with evidence markers at the beam and bolted connection"
                  className="h-full w-full"
                  fill="none"
                  role="img"
                  viewBox="0 0 640 480"
                >
                  <path
                    d="M78 404V92M282 404V92M486 404V92M60 404h462M78 112h408M78 246h408M78 379h408"
                    stroke="#D9DADE"
                    strokeWidth="8"
                  />
                  <path
                    d="M78 112 282 246 486 112M78 379l204-133 204 133"
                    stroke="#8B8D96"
                    strokeWidth="5"
                  />
                  <path
                    d="M262 224h40v44h-40zM466 90h40v44h-40z"
                    fill="#12131A"
                    stroke="#F6F6F7"
                    strokeWidth="3"
                  />
                  <circle
                    cx="281"
                    cy="246"
                    r="24"
                    fill="#fff"
                    stroke="#FF0076"
                    strokeWidth="5"
                  />
                  <text
                    x="281"
                    y="252"
                    fill="#D00060"
                    fontFamily="monospace"
                    fontSize="16"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    14
                  </text>
                  <circle
                    cx="486"
                    cy="112"
                    r="20"
                    fill="#fff"
                    stroke="#4C3A8A"
                    strokeWidth="5"
                  />
                  <text
                    x="486"
                    y="118"
                    fill="#4C3A8A"
                    fontFamily="monospace"
                    fontSize="14"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    A
                  </text>
                </svg>
                <div className="absolute right-3 bottom-3 border border-white/30 bg-brand-black/90 px-3 py-2 font-mono text-[10px] text-white/75">
                  CAPTURED 24 JUL 2026 · 10:42
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  { icon: ImageIcon, ref: "IMG-128", label: "Overview" },
                  { icon: FileText, ref: "BOQ-41", label: "Steelwork" },
                  { icon: Ruler, ref: "MSR-09", label: "Depth 203 mm" },
                ].map(({ icon: EvidenceIcon, label, ref }) => {
                  return (
                    <button
                      className="flex min-h-12 items-center gap-3 border border-white/20 bg-white/5 px-3 text-left transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      key={String(ref)}
                      type="button"
                    >
                      <EvidenceIcon
                        aria-hidden="true"
                        size={17}
                        strokeWidth={1.75}
                      />
                      <span>
                        <span className="block font-mono text-[10px] text-white/55">
                          {ref}
                        </span>
                        <span className="block text-xs font-semibold">
                          {label}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              aria-labelledby="proposal-title"
              className="border-b border-rule bg-paper p-5 xl:border-r xl:border-b-0 md:p-6"
            >
              <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-evidence uppercase">
                Model proposal · Gemini · schema 0.1
              </p>
              <h3
                className="mt-3 font-heading text-2xl font-bold"
                id="proposal-title"
              >
                Structural steel I-section
              </h3>
              <p className="mt-3 leading-7 text-ink-muted">
                Painted rolled steel member, likely part of the primary frame.
                The visible section and apparent bolted connection may support
                careful deconstruction and direct reuse assessment.
              </p>

              <dl className="mt-6 border-t border-rule">
                {[
                  ["Proposed quantity", "8 members · approx. 4.8 t"],
                  ["Observed condition", "Coating worn; no visible distortion"],
                  ["Proposed route", "Direct reuse assessment"],
                  [
                    "Evidence support",
                    "Good for identity; partial for condition",
                  ],
                ].map(([term, value]) => (
                  <div
                    className="grid grid-cols-[132px_1fr] gap-4 border-b border-rule py-3 text-sm"
                    key={term}
                  >
                    <dt className="text-ink-muted">{term}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 border-l-4 border-attention bg-attention-wash p-4">
                <div className="flex items-start gap-3">
                  <CircleAlert
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-attention"
                    size={19}
                  />
                  <div>
                    <h4 className="font-heading font-semibold text-attention">
                      Unknown before route approval
                    </h4>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-ink">
                      <li>Connection close-up is not available.</li>
                      <li>Section stamp has not been transcribed.</li>
                      <li>Coating and contamination status require review.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <aside
              aria-labelledby="decision-title"
              className="bg-paper-subtle p-5 md:p-6"
            >
              <p className="font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                Human decision gate
              </p>
              <h3
                className="mt-2 font-heading text-xl font-bold"
                id="decision-title"
              >
                What should happen next?
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Your choice becomes part of the review history.
              </p>

              <div className="mt-5 space-y-2">
                {[
                  {
                    value: "accepted" as const,
                    icon: Check,
                    title: "Accept observation",
                    help: "Identity and description are supported.",
                  },
                  {
                    value: "corrected" as const,
                    icon: RotateCcw,
                    title: "Correct proposal",
                    help: "Edit identity, condition, or quantity.",
                  },
                  {
                    value: "evidence" as const,
                    icon: ImageIcon,
                    title: "Request evidence",
                    help: "Keep the candidate open with a site task.",
                  },
                ].map(({ help, icon: DecisionIcon, title, value }) => {
                  const selected = decision === value;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`flex min-h-16 w-full items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                        selected
                          ? "border-action bg-brand-wash"
                          : "border-rule bg-paper hover:border-rule-strong"
                      }`}
                      key={value}
                      onClick={() => setDecision(value)}
                      type="button"
                    >
                      <span
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-action bg-action text-white"
                            : "border-rule text-ink-muted"
                        }`}
                      >
                        <DecisionIcon aria-hidden="true" size={15} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
                          {help}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {decision && (
                <div
                  aria-live="polite"
                  className="mt-4 border border-verified/30 bg-verified-wash p-3 text-sm text-verified"
                >
                  Decision selected. In the production flow, you would add a
                  reason before saving.
                </div>
              )}

              <button
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-action bg-action px-5 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink disabled:cursor-not-allowed disabled:border-rule disabled:bg-rule disabled:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                disabled={!decision}
                type="button"
              >
                Continue with selected action
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
                Demonstration only—no record is persisted yet.
              </p>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
