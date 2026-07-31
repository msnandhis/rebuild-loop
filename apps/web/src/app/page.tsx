import {
  ArrowRight,
  Camera,
  Check,
  ClipboardCheck,
  FileCheck2,
  ScanLine,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ActionLink, StatusTag } from "@rebuild/ui";

import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const stages = [
  {
    number: "01",
    title: "Add site photos",
    description:
      "Upload photos of the materials and parts you want to check before work begins.",
    icon: Camera,
  },
  {
    number: "02",
    title: "Review Gemini’s suggestions",
    description:
      "Gemini suggests what may be visible, points to the source photo, and lists what the photo cannot prove.",
    icon: ScanLine,
  },
  {
    number: "03",
    title: "Make the decision",
    description:
      "Accept, correct, or reject each suggestion. Ask for another photo or specialist advice when information is missing.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Approve the recovery plan",
    description:
      "The final plan keeps the photos, changes, decisions, limits, and named approver together.",
    icon: FileCheck2,
  },
];

const registerRows = [
  {
    ref: "MAT-014",
    item: "Steel I-section",
    evidence: "IMG-128",
    route: "Check for reuse",
    status: "Needs review",
    tone: "attention" as const,
  },
  {
    ref: "MAT-021",
    item: "Timber door",
    evidence: "IMG-141",
    route: "Specialist review",
    status: "More photos needed",
    tone: "attention" as const,
  },
  {
    ref: "MAT-036",
    item: "Mineral rubble",
    evidence: "IMG-203",
    route: "Keep separate",
    status: "Quantity missing",
    tone: "evidence" as const,
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="overflow-hidden bg-paper">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:px-8 md:py-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <h1 className="max-w-2xl font-heading text-[2.5rem] leading-[1.08] font-bold tracking-[-0.045em] text-ink md:text-[3.5rem] md:leading-[1.1]">
                Plan what to recover before demolition starts.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-ink-muted">
                Turn site photos into a materials list that people review,
                correct, and approve before useful items become mixed waste.
              </p>
              <div className="mt-7">
                <ActionLink href="/sign-in?demo=1">
                  Explore app
                  <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
                </ActionLink>
              </div>
            </div>

            <figure className="overflow-hidden rounded-xl border border-rule bg-paper-subtle">
              <Image
                alt="A site reviewer photographing installed brick, steel, timber, glass, and lighting before renovation."
                className="aspect-[16/10] h-full w-full object-cover"
                height={1024}
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                src="/images/material-survey-hero-v2.webp"
                unoptimized
                width={1536}
              />
            </figure>
          </div>
        </section>

        <section className="border-y border-rule bg-brand-black text-white">
          <div className="mx-auto grid max-w-7xl divide-y divide-white/15 px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
            {[
              [
                "Start with photos",
                "Every suggestion points back to the site photo it came from.",
              ],
              [
                "People make the call",
                "Gemini can suggest. It cannot approve its own work.",
              ],
              [
                "Keep unknowns visible",
                "Missing details stay open until someone checks them.",
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

        <section className="scroll-mt-16 bg-canvas" id="how-it-works">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
            <div className="grid gap-8 border-b border-rule pb-10 md:grid-cols-[0.7fr_1.3fr]">
              <p className="font-mono text-xs font-medium tracking-[0.16em] text-action uppercase">
                How it works
              </p>
              <div>
                <h2 className="max-w-3xl font-heading text-3xl leading-tight font-bold tracking-[-0.035em] md:text-4xl">
                  From site photos to an approved recovery plan.
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
                  The source photo, Gemini’s suggestion, and the person’s
                  decision always remain separate and clear.
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

        <section className="scroll-mt-16 bg-paper" id="materials">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-xs font-medium tracking-[0.16em] text-action uppercase">
                  Example materials list
                </p>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em]">
                  A clear record for every item.
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
                  Each item keeps its source photo, suggested next step, and
                  review status. These sample entries are for demonstration.
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-action underline decoration-action/35 underline-offset-4 hover:decoration-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                href="/projects/demo/review"
              >
                See how an item is reviewed
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
              </Link>
            </div>
            <div className="overflow-x-auto border border-rule">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-brand-black font-mono text-[11px] tracking-[0.1em] text-white uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Material item</th>
                    <th className="px-4 py-3 font-medium">Source photo</th>
                    <th className="px-4 py-3 font-medium">
                      Suggested next step
                    </th>
                    <th className="px-4 py-3 font-medium">Status</th>
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

        <section
          className="scroll-mt-16 border-t border-rule bg-brand-light"
          id="sample-review"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-[1fr_auto] md:items-center md:px-8 md:py-20">
            <div>
              <p className="font-mono text-xs font-medium tracking-[0.16em] text-action uppercase">
                Try the example
              </p>
              <h2 className="mt-3 max-w-2xl font-heading text-3xl font-bold tracking-[-0.035em]">
                See how a site photo becomes a reviewed decision.
              </h2>
            </div>
            <ActionLink href="/projects/demo/review">
              Open the sample review
              <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
            </ActionLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
