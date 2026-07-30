/* eslint-disable @next/next/no-img-element */
import { ArrowLeft, CircleAlert, FileCheck2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import {
  CandidateNotFoundError,
  findCandidate,
} from "../../../../../../lib/candidates";
import { findOwnedProject } from "../../../../../../lib/projects";
import { requireSession } from "../../../../../../lib/session";

export default async function CandidateReviewPage({
  params,
}: {
  params: Promise<{ candidateId: string; projectId: string }>;
}) {
  const session = await requireSession();
  const { candidateId, projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);

  if (!project) {
    notFound();
  }

  let result;
  try {
    result = await findCandidate(candidateId, projectId, session.user.id);
  } catch (error) {
    if (error instanceof CandidateNotFoundError) {
      notFound();
    }
    throw error;
  }

  const { candidate, evidence } = result;
  const unknowns = toStringArray(candidate.unknowns);
  const riskFlags = toStringArray(candidate.risk_flags);
  const condition = toCondition(candidate.condition);
  const quantity = toQuantity(candidate.quantity);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-12">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        href={`/projects/${projectId}/review`}
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Proposal queue
      </Link>

      <header className="mt-5 flex flex-col gap-4 border-y border-rule bg-paper px-5 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-xs text-ink-muted">
            {project.code} / REVISION {candidate.revision_number}
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold md:text-3xl">
            {candidate.subtype ?? candidate.material_family}
          </h1>
        </div>
        <StatusTag tone="neutral">Inspection available</StatusTag>
      </header>

      <div className="mt-7 grid border border-rule bg-paper xl:grid-cols-[46fr_34fr_minmax(280px,20fr)]">
        <section
          aria-labelledby="evidence-heading"
          className="border-b border-rule xl:border-r xl:border-b-0"
        >
          <div className="border-b border-rule px-5 py-4">
            <p className="font-mono text-[11px] text-evidence">SOURCE LAYER</p>
            <h2
              className="mt-1 font-heading text-xl font-bold"
              id="evidence-heading"
            >
              Supplied evidence
            </h2>
          </div>
          <div className="space-y-6 p-5">
            {evidence.map((item) => (
              <figure className="border border-rule" key={item.mediaAssetId}>
                <div className="aspect-[4/3] overflow-hidden bg-paper-subtle">
                  <img
                    alt={`Site evidence ${item.originalFilename}: ${item.observation}`}
                    className="h-full w-full object-contain"
                    decoding="async"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={item.viewUrl}
                  />
                </div>
                <figcaption className="border-t border-rule px-4 py-3">
                  <p className="font-mono text-[11px] text-evidence">
                    EVIDENCE {item.ordinal + 1} /{" "}
                    {item.mediaAssetId.slice(0, 8)}
                  </p>
                  <p className="mt-1 break-words text-xs font-semibold">
                    {item.originalFilename}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-ink-muted">
                    {formatLocator(item.locatorKind, item.locator)}
                  </p>
                  <p className="mt-1 text-sm leading-6">{item.observation}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="proposal-heading"
          className="border-b border-rule xl:border-r xl:border-b-0"
        >
          <div className="border-b border-rule px-5 py-4">
            <p className="font-mono text-[11px] text-ink-muted">
              MODEL PROPOSAL / GEMINI
            </p>
            <h2
              className="mt-1 font-heading text-xl font-bold"
              id="proposal-heading"
            >
              Preliminary observation
            </h2>
          </div>
          <div className="space-y-6 p-5">
            <div>
              <h3 className="text-sm font-semibold text-ink-muted">
                Visible observation
              </h3>
              <p className="mt-2 leading-7">{candidate.observation_summary}</p>
            </div>
            <div className="border-l-4 border-attention bg-attention-wash px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-attention">
                <CircleAlert aria-hidden="true" size={17} />
                Unknowns
              </h3>
              {unknowns.length ? (
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">
                  {unknowns.map((unknown) => (
                    <li key={unknown}>{unknown}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm">No unknown was recorded.</p>
              )}
            </div>
            {riskFlags.length > 0 && !riskFlags.includes("NONE") ? (
              <div className="border-l-4 border-blocked bg-blocked-wash px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-blocked">
                  <ShieldAlert aria-hidden="true" size={17} />
                  Risk and specialist flags
                </h3>
                <p className="mt-2 text-sm leading-6">
                  {riskFlags.map(humanize).join(" · ")}
                </p>
              </div>
            ) : null}
            <dl className="grid gap-3 border-t border-rule pt-5 text-sm sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <dt className="text-ink-muted">Material family</dt>
                <dd className="mt-1 font-semibold">
                  {humanize(candidate.material_family)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Preliminary pathway</dt>
                <dd className="mt-1 font-semibold">
                  {humanize(candidate.preliminary_pathway)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Visible condition</dt>
                <dd className="mt-1 font-semibold">
                  {condition
                    ? `${humanize(condition.grade)} · ${confidenceLabel(condition.confidence)} model confidence`
                    : "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Quantity estimate</dt>
                <dd className="mt-1 font-semibold">
                  {quantity
                    ? formatQuantity(
                        quantity.minimum,
                        quantity.maximum,
                        quantity.unit,
                      )
                    : "Not recorded"}
                </dd>
                {quantity && (
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    Basis: {quantity.basis} ·{" "}
                    {confidenceLabel(quantity.confidence)} model confidence
                  </p>
                )}
              </div>
              <div>
                <dt className="text-ink-muted">Proposal confidence</dt>
                <dd className="mt-1 font-semibold">
                  {confidenceLabel(candidate.overall_confidence)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Specialist review</dt>
                <dd className="mt-1 font-semibold">
                  {candidate.specialist_review_required
                    ? "Required before a decision"
                    : "Not explicitly requested by the model"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <aside aria-labelledby="decision-heading" className="bg-brand-wash/40">
          <div className="border-b border-rule px-5 py-4">
            <p className="font-mono text-[11px] text-action">HUMAN LAYER</p>
            <h2
              className="mt-1 font-heading text-xl font-bold"
              id="decision-heading"
            >
              Decision recording
            </h2>
          </div>
          <div className="p-5">
            <div className="border border-action bg-paper px-4 py-4">
              <FileCheck2
                aria-hidden="true"
                className="text-action"
                size={22}
              />
              <h3 className="mt-3 font-heading text-lg font-bold">
                Decision recording is not yet available.
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Evidence and proposal remain separate. This model output is not
                an approval, certification, or reuse decision; this screen is
                inspection-only in the current build.
              </p>
            </div>
            <Link
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-action px-5 text-sm font-semibold text-action hover:bg-brand-wash"
              href={`/projects/${projectId}/review`}
            >
              Return to queue
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function confidenceLabel(value: number): string {
  if (value < 0.4) {
    return "Limited";
  }
  if (value < 0.7) {
    return "Moderate";
  }
  return "Stronger";
}

function formatLocator(kind: string, value: unknown): string {
  if (kind !== "REGION") {
    return "Locator: full image";
  }

  const region = isRecord(value) ? value : {};
  const x = asNumber(region.x);
  const y = asNumber(region.y);
  const width = asNumber(region.width);
  const height = asNumber(region.height);
  if ([x, y, width, height].some((part) => part === null)) {
    return "Locator: cited image region";
  }

  return `Locator: region x ${asPercent(x!)} · y ${asPercent(y!)} · w ${asPercent(width!)} · h ${asPercent(height!)}`;
}

function formatQuantity(
  minimum: number,
  maximum: number,
  unit: string,
): string {
  const range =
    minimum === maximum
      ? formatNumber(minimum)
      : `${formatNumber(minimum)}–${formatNumber(maximum)}`;
  return `${range} ${humanize(unit)}`;
}

function toCondition(
  value: unknown,
): { confidence: number; grade: string } | null {
  if (!isRecord(value)) {
    return null;
  }
  const confidence = asNumber(value.confidence);
  return typeof value.grade === "string" && confidence !== null
    ? { confidence, grade: value.grade }
    : null;
}

function toQuantity(value: unknown): {
  basis: string;
  confidence: number;
  maximum: number;
  minimum: number;
  unit: string;
} | null {
  if (!isRecord(value)) {
    return null;
  }
  const confidence = asNumber(value.confidence);
  const maximum = asNumber(value.maximum);
  const minimum = asNumber(value.minimum);
  if (
    typeof value.basis !== "string" ||
    typeof value.unit !== "string" ||
    confidence === null ||
    maximum === null ||
    minimum === null
  ) {
    return null;
  }
  return {
    basis: value.basis,
    confidence,
    maximum,
    minimum,
    unit: value.unit,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}
