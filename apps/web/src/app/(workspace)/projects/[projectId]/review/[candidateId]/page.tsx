/* eslint-disable @next/next/no-img-element */
import { ArrowLeft, CircleAlert, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { ClarificationTask } from "../../../../../../components/review/clarification-task";
import { DecisionGate } from "../../../../../../components/review/decision-gate";
import { RevisionHistory } from "../../../../../../components/review/revision-history";
import { quietControl } from "../../../../../../components/workspace/controls";
import {
  CandidateNotFoundError,
  findCandidate,
} from "../../../../../../lib/candidates";
import { listClarificationTasks } from "../../../../../../lib/clarifications";
import { findOwnedProject } from "../../../../../../lib/projects";
import { listReviewDecisions } from "../../../../../../lib/review-decisions";
import { requireSession } from "../../../../../../lib/session";

export const metadata = {
  title: "Review material",
};

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

  const { candidate, evidence, revisions } = result;
  const [decisions, clarifications] = await Promise.all([
    listReviewDecisions(candidateId, projectId, session.user.id),
    listClarificationTasks(candidateId, projectId, session.user.id),
  ]);
  const currentDecision = decisions.find(
    (decision) => decision.candidate_revision_id === candidate.revision_id,
  );
  const unknowns = toStringArray(candidate.unknowns);
  const riskFlags = toStringArray(candidate.risk_flags);
  const condition = toCondition(candidate.condition);
  const quantity = toQuantity(candidate.quantity);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Link className={quietControl} href={`/projects/${projectId}/review`}>
            <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.75} />
            Proposals
          </Link>
          <span aria-hidden="true" className="text-rule-strong">
            /
          </span>
          <h2 className="text-[15px] font-semibold">
            {candidate.subtype ?? candidate.material_family}
          </h2>
          <span className="font-mono text-[11px] text-ink-muted tabular-nums">
            rev {String(candidate.revision_number).padStart(2, "0")}
          </span>
        </div>
        <StatusTag tone={currentDecision ? "verified" : "attention"}>
          {currentDecision ? "Decision recorded" : "Decision required"}
        </StatusTag>
      </div>

      <div className="grid border border-rule bg-paper xl:grid-cols-[46fr_34fr_minmax(300px,20fr)]">
        <section
          aria-labelledby="evidence-heading"
          className="border-b border-rule xl:border-r xl:border-b-0"
        >
          <div className="border-b border-rule px-4 py-2.5">
            <h3
              className="text-[13px] font-semibold text-evidence"
              id="evidence-heading"
            >
              Source evidence
            </h3>
          </div>
          <div className="space-y-4 p-4">
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
                <figcaption className="border-t border-rule px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-[10px] text-evidence tabular-nums">
                      E{String(item.ordinal + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                      {item.originalFilename}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-5">
                    {item.observation}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-ink-muted">
                    {formatLocator(item.locatorKind, item.locator)}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="proposal-heading"
          className="border-b border-rule xl:border-r xl:border-b-0"
        >
          <div className="flex items-center justify-between gap-2 border-b border-rule px-4 py-2.5">
            <h3 className="text-[13px] font-semibold" id="proposal-heading">
              Model proposal
            </h3>
            <span className="font-mono text-[10px] text-ink-muted">
              GEMINI · PRELIMINARY
            </span>
          </div>
          <div className="space-y-4 p-4">
            <p className="text-sm leading-6">{candidate.observation_summary}</p>

            <div className="border-l-2 border-attention bg-attention-wash px-3 py-2.5">
              <h4 className="flex items-center gap-1.5 text-[12px] font-semibold text-attention">
                <CircleAlert aria-hidden="true" size={14} strokeWidth={1.75} />
                {unknowns.length
                  ? `${unknowns.length} unknown${unknowns.length === 1 ? "" : "s"}`
                  : "No unknowns recorded"}
              </h4>
              {unknowns.length ? (
                <ul className="mt-1.5 space-y-1 text-[13px] leading-5">
                  {unknowns.map((unknown) => (
                    <li key={unknown}>{unknown}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {riskFlags.length > 0 && !riskFlags.includes("NONE") ? (
              <div className="border-l-2 border-blocked bg-blocked-wash px-3 py-2.5">
                <h4 className="flex items-center gap-1.5 text-[12px] font-semibold text-blocked">
                  <ShieldAlert
                    aria-hidden="true"
                    size={14}
                    strokeWidth={1.75}
                  />
                  Risk flags
                </h4>
                <p className="mt-1.5 text-[13px] leading-5">
                  {riskFlags.map(humanize).join(" · ")}
                </p>
              </div>
            ) : null}

            <dl className="divide-y divide-rule border-t border-rule">
              <SpecRow
                label="Material family"
                value={humanize(candidate.material_family)}
              />
              <SpecRow
                label="Preliminary pathway"
                value={humanize(candidate.preliminary_pathway)}
              />
              <SpecRow
                label="Condition"
                note={
                  condition
                    ? `${confidenceLabel(condition.confidence)} model confidence`
                    : undefined
                }
                value={condition ? humanize(condition.grade) : "Not recorded"}
              />
              <SpecRow
                label="Quantity"
                mono={Boolean(quantity)}
                note={
                  quantity
                    ? `${quantity.basis} · ${confidenceLabel(quantity.confidence)} model confidence`
                    : undefined
                }
                value={
                  quantity
                    ? formatQuantity(
                        quantity.minimum,
                        quantity.maximum,
                        quantity.unit,
                      )
                    : "Not recorded"
                }
              />
              <SpecRow
                label="Overall confidence"
                value={confidenceLabel(candidate.overall_confidence)}
              />
              <SpecRow
                label="Specialist review"
                value={
                  candidate.specialist_review_required
                    ? "Required before a decision"
                    : "Not requested"
                }
              />
            </dl>
          </div>
        </section>

        <aside aria-labelledby="decision-heading" className="bg-brand-wash/40">
          <div className="border-b border-rule px-4 py-2.5">
            <h3
              className="text-[13px] font-semibold text-action"
              id="decision-heading"
            >
              Your decision
            </h3>
          </div>
          <DecisionGate
            candidate={{
              materialFamily: candidate.material_family,
              observationSummary: candidate.observation_summary,
              preliminaryPathway: candidate.preliminary_pathway,
              revisionId: candidate.revision_id,
              subtype: candidate.subtype,
            }}
            currentDecision={
              currentDecision
                ? {
                    action: currentDecision.action,
                    createdAt: toIsoString(currentDecision.created_at),
                    reason: currentDecision.reason ?? "",
                  }
                : null
            }
            projectId={projectId}
            threadId={candidateId}
          />
          {clarifications.length > 0 && (
            <div className="space-y-3 border-t border-rule p-4">
              <h4 className="text-[13px] font-semibold">Evidence requests</h4>
              {clarifications.map((task) => (
                <ClarificationTask
                  instruction={task.instruction}
                  key={task.id}
                  projectId={projectId}
                  rationale={task.rationale}
                  requiredEvidence={task.required_evidence}
                  status={task.status}
                  taskId={task.id}
                />
              ))}
            </div>
          )}
        </aside>
      </div>

      <RevisionHistory
        revisions={revisions.map((revision) => ({
          condition: revision.condition,
          createdAt: toIsoString(revision.created_at),
          disposition: revision.disposition,
          materialFamily: revision.material_family,
          observationSummary: revision.observation_summary,
          overallConfidence: revision.overall_confidence,
          preliminaryPathway: revision.preliminary_pathway,
          quantity: revision.quantity,
          revisionId: revision.revision_id,
          revisionNumber: revision.revision_number,
          riskFlags: revision.risk_flags,
          specialistReviewRequired: Boolean(
            revision.specialist_review_required,
          ),
          subtype: revision.subtype,
          unknowns: revision.unknowns,
        }))}
      />
    </div>
  );
}

/** A label/value pair in the proposal specification list. */
function SpecRow({
  label,
  mono = false,
  note,
  value,
}: {
  label: string;
  mono?: boolean;
  note?: string | undefined;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-3 py-2">
      <dt className="text-[12px] text-ink-muted">{label}</dt>
      <dd>
        <span
          className={
            mono
              ? "font-mono text-[13px] font-medium tabular-nums"
              : "text-[13px] font-medium"
          }
        >
          {value}
        </span>
        {note ? (
          <span className="mt-0.5 block text-[11px] leading-4 text-ink-muted">
            {note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
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
