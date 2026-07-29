import {
  ArrowRight,
  Camera,
  Check,
  ClipboardCheck,
  FileCheck2,
  ScanLine,
} from "lucide-react";
import Link from "next/link";

import { ActionLink, StatusTag } from "@rebuild/ui";

import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const stages = [
  {
    number: "01",
    title: "Capture what is actually there",
    description:
      "A guided site manifest connects photos, video, plans, BOQs, and measurements to the part of the building they describe.",
    icon: Camera,
  },
  {
    number: "02",
    title: "Review model proposals",
    description:
      "Each material candidate carries its evidence references, uncertainty, missing information, and required human decision.",
    icon: ScanLine,
  },
  {
    number: "03",
    title: "Approve a recovery route",
    description:
      "Rule-based gates separate direct reuse, repair, recycling, specialist review, and EPR-relevant mineral streams.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Export the recovery pack",
    description:
      "The approved ledger becomes a traceable plan with limitations, evidence links, and a formal sign-off record.",
    icon: FileCheck2,
  },
];

const registerRows = [
  {
    ref: "MAT-014",
    item: "Steel I-section",
    evidence: "IMG-128 · BOQ-41",
    route: "Direct reuse",
    status: "Ready for review",
    tone: "verified" as const,
  },
  {
    ref: "MAT-021",
    item: "Timber floor joists",
    evidence: "VID-08 · 00:14",
    route: "Repair / reuse",
    status: "Close-up needed",
    tone: "attention" as const,
  },
  {
    ref: "MAT-036",
    item: "Mineral rubble",
    evidence: "IMG-203 · ZN-C",
    route: "EPR register",
    status: "Quantity pending",
    tone: "evidence" as const,
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="overflow-hidden bg-paper">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-brand" />
                <span className="font-mono text-xs font-medium tracking-[0.16em] text-action uppercase">
                  Pre-demolition material intelligence
                </span>
              </div>
              <h1 className="max-w-2xl font-heading text-[2.5rem] leading-[1.08] font-bold tracking-[-0.045em] text-ink md:text-[3.5rem] md:leading-[1.1]">
                Know what a building can become before it comes down.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">
                ReBuild Loop turns site evidence into a human-approved materials
                ledger, recovery plan, and traceable handover pack—before useful
                assets become mixed waste.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ActionLink href="/projects/demo/review">
                  Review a demonstration
                  <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
                </ActionLink>
                <ActionLink href="#how-it-works" tone="secondary">
                  See how it works
                </ActionLink>
              </div>
              <p className="mt-5 max-w-lg text-sm leading-6 text-ink-muted">
                Model proposals never approve their own findings. Named people
                accept, correct, or block every consequential decision.
              </p>
            </div>

            <div className="relative lg:pl-6">
              <div
                aria-label="Example evidence register"
                className="relative border border-rule-strong bg-paper shadow-sheet"
                role="img"
              >
                <div className="flex items-center justify-between border-b border-rule bg-paper-subtle px-4 py-3">
                  <div>
                    <p className="font-mono text-[11px] font-medium tracking-[0.12em] text-ink-muted uppercase">
                      Survey record / Zone B
                    </p>
                    <p className="mt-1 text-sm font-semibold">North workshop</p>
                  </div>
                  <StatusTag tone="attention">2 items need evidence</StatusTag>
                </div>
                <div className="ledger-grid relative aspect-[4/2.4] overflow-hidden bg-brand-light p-5 sm:p-8">
                  <svg
                    aria-hidden="true"
                    className="h-full w-full text-ink"
                    fill="none"
                    viewBox="0 0 540 300"
                  >
                    <path
                      d="M55 232V94l74-42 74 42v138M203 112h242v120H203M228 137h66v70h-66M320 137h98M320 165h98M320 193h98"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="m54 95 75 43 74-43M129 138v94M90 177h77M90 203h77"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="5 5"
                    />
                    <path
                      d="M43 246h415"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="269"
                      cy="170"
                      r="13"
                      fill="#fff"
                      stroke="#D00060"
                      strokeWidth="3"
                    />
                    <text
                      x="269"
                      y="174"
                      fill="#D00060"
                      fontFamily="monospace"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      14
                    </text>
                    <circle
                      cx="370"
                      cy="137"
                      r="13"
                      fill="#fff"
                      stroke="#4C3A8A"
                      strokeWidth="3"
                    />
                    <text
                      x="370"
                      y="141"
                      fill="#4C3A8A"
                      fontFamily="monospace"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      21
                    </text>
                  </svg>
                </div>
                <div className="grid grid-cols-[auto_1fr_auto] items-center border-t border-rule px-4 py-3 text-xs">
                  <span className="font-mono text-ink-muted">EVD-2407-B</span>
                  <span className="mx-3 h-px bg-rule" />
                  <span className="font-medium text-verified">
                    Evidence indexed
                  </span>
                </div>
              </div>
              <div className="absolute -right-3 -bottom-5 hidden w-52 border border-rule bg-paper p-4 shadow-sheet sm:block">
                <p className="font-mono text-[10px] tracking-[0.14em] text-evidence uppercase">
                  Evidence note 14
                </p>
                <p className="mt-2 text-sm font-semibold">
                  Steel primary frame
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">
                  Section mark visible. Connection detail still required.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-rule bg-brand-black text-white">
          <div className="mx-auto grid max-w-7xl divide-y divide-white/15 px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
            {[
              [
                "Evidence first",
                "Every proposal links back to a photo, file, timecode, or measurement.",
              ],
              [
                "Human decided",
                "Approval gates give professionals the final word—and record who decided.",
              ],
              [
                "Limitations visible",
                "Unknowns and specialist checks travel with the material, not in hidden notes.",
              ],
            ].map(([title, body]) => (
              <div
                className="py-7 md:px-7 md:first:pl-0 md:last:pr-0"
                key={title}
              >
                <div className="flex gap-3">
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-brand"
                    size={18}
                    strokeWidth={2}
                  />
                  <div>
                    <p className="font-heading font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/65">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-canvas" id="how-it-works">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
            <div className="grid gap-8 border-b border-rule pb-10 md:grid-cols-[0.7fr_1.3fr]">
              <p className="font-mono text-xs font-medium tracking-[0.16em] text-action uppercase">
                From survey to sign-off
              </p>
              <div>
                <h2 className="max-w-3xl font-heading text-3xl leading-tight font-bold tracking-[-0.035em] md:text-4xl">
                  A review workflow, not a black-box waste forecast.
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
                  ReBuild Loop separates what the evidence shows, what the model
                  proposes, and what a responsible person has approved.
                </p>
              </div>
            </div>
            <ol className="divide-y divide-rule">
              {stages.map(({ description, icon: Icon, number, title }) => (
                <li
                  className="grid gap-4 py-7 md:grid-cols-[80px_1fr_1.2fr] md:items-start md:gap-8"
                  key={number}
                >
                  <span className="font-mono text-sm font-medium text-action">
                    {number}
                  </span>
                  <div className="flex items-start gap-3">
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-ink-muted"
                      size={21}
                      strokeWidth={1.75}
                    />
                    <h3 className="font-heading text-lg font-semibold">
                      {title}
                    </h3>
                  </div>
                  <p className="max-w-xl leading-7 text-ink-muted">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-paper">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-xs font-medium tracking-[0.16em] text-action uppercase">
                  Materials register / sample
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em]">
                  Decisions that can be audited.
                </h2>
              </div>
              <Link
                className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-action underline decoration-action/35 underline-offset-4 hover:decoration-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                href="/projects/demo/review"
              >
                Inspect the full review
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
              </Link>
            </div>
            <div className="overflow-x-auto border border-rule">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-brand-black font-mono text-[11px] tracking-[0.1em] text-white uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Material item</th>
                    <th className="px-4 py-3 font-medium">Evidence</th>
                    <th className="px-4 py-3 font-medium">Proposed route</th>
                    <th className="px-4 py-3 font-medium">Review state</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {registerRows.map((row) => (
                    <tr className="bg-paper hover:bg-brand-light" key={row.ref}>
                      <td className="px-4 py-4 font-mono text-xs font-medium">
                        {row.ref}
                      </td>
                      <td className="px-4 py-4 font-semibold">{row.item}</td>
                      <td className="px-4 py-4 font-mono text-xs text-evidence">
                        {row.evidence}
                      </td>
                      <td className="px-4 py-4">{row.route}</td>
                      <td className="px-4 py-4">
                        <StatusTag tone={row.tone}>{row.status}</StatusTag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t border-rule bg-brand-light">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-[1fr_auto] md:items-center md:px-8 md:py-20">
            <div>
              <p className="font-mono text-xs font-medium tracking-[0.16em] text-action uppercase">
                Demonstration workspace
              </p>
              <h2 className="mt-3 max-w-2xl font-heading text-3xl font-bold tracking-[-0.035em]">
                See the evidence, uncertainty, and approval gate together.
              </h2>
            </div>
            <ActionLink href="/projects/demo/review">
              Enter review workbench
              <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
            </ActionLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
