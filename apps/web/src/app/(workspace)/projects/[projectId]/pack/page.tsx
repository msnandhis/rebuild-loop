import {
  ArrowRight,
  CircleCheck,
  History,
  OctagonAlert,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { RecoveryActionButton } from "../../../../../components/recovery/recovery-actions";
import { RecoveryPlanPreparation } from "../../../../../components/recovery/recovery-plan-preparation";
import {
  primaryControl,
  quietControl,
} from "../../../../../components/workspace/controls";
import { EmptyState } from "../../../../../components/workspace/empty-state";
import { LimitationNote } from "../../../../../components/workspace/limitation-note";
import { Panel } from "../../../../../components/workspace/panel";
import {
  isFinalReviewDecision,
  listCandidates,
} from "../../../../../lib/candidates";
import { findOwnedProject } from "../../../../../lib/projects";
import {
  findCurrentRecoveryPlan,
  listConfirmedInventory,
  listPathwayAssessments,
  type MaterialLedgerItem,
  recoveryPlanSourceHash,
} from "../../../../../lib/recovery";
import { requireSession } from "../../../../../lib/session";

export const metadata = {
  title: "Recovery plan",
};

export default async function RecoveryPlanPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);
  if (!project) notFound();

  const [inventory, pathways, plan, candidates] = await Promise.all([
    listConfirmedInventory(project.id, session.user.id),
    listPathwayAssessments(project.id, session.user.id),
    findCurrentRecoveryPlan(project.id, session.user.id),
    listCandidates(project.id, session.user.id),
  ]);
  const undecided = candidates.filter(
    (candidate) => !isFinalReviewDecision(candidate.latest_decision_action),
  ).length;
  const reviewComplete = candidates.length > 0 && undecided === 0;
  const sourceHash =
    inventory.length > 0 && pathways.length === inventory.length
      ? recoveryPlanSourceHash(pathways)
      : null;
  const planIsCurrent = Boolean(
    plan && sourceHash && plan.sourceHash === sourceHash,
  );
  const approved =
    reviewComplete && planIsCurrent && plan?.status === "APPROVED";
  const needsPreparation =
    reviewComplete && inventory.length > 0 && !planIsCurrent;
  const pathwaysByRevision = new Map(
    pathways.map((pathway) => [pathway.inventoryRevisionId, pathway]),
  );
  const blocked = pathways.filter((pathway) =>
    pathway.gates.some((gate) => gate.status === "BLOCKED"),
  );
  const issueCount = blocked.length + (undecided > 0 ? 1 : 0);

  if (!inventory.length) {
    return (
      <div className="max-w-[920px]">
        <Panel
          status={<StatusTag tone="attention">Not ready</StatusTag>}
          title="Recovery plan"
          titleId="recovery-plan"
        >
          <EmptyState
            action={
              <Link
                className={primaryControl}
                href={`/projects/${project.id}/review`}
              >
                Review materials
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
              </Link>
            }
          >
            Accept or correct at least one material proposal to start the
            recovery plan.
          </EmptyState>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needsPreparation ? (
        <RecoveryPlanPreparation
          endpoint={`/api/v1/projects/${project.id}/plans`}
        />
      ) : null}

      {issueCount ? (
        <Panel
          status={
            <StatusTag tone="blocked">
              {issueCount} {issueCount === 1 ? "issue" : "issues"}
            </StatusTag>
          }
          title="Issues to resolve"
          titleId="issues"
        >
          <ol className="divide-y divide-rule">
            {undecided ? (
              <li className="grid gap-2 px-4 py-3.5 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] md:items-start">
                <div>
                  <p className="text-sm font-semibold">Material review</p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-muted">
                    {undecided} {undecided === 1 ? "proposal" : "proposals"}
                  </p>
                </div>
                <p className="text-[13px] leading-5 text-ink-muted">
                  Make a decision on every proposal before approving the
                  recovery plan.
                </p>
                <Link
                  className={quietControl}
                  href={`/projects/${project.id}/review`}
                >
                  Review materials
                  <ArrowRight aria-hidden="true" size={14} strokeWidth={1.75} />
                </Link>
              </li>
            ) : null}
            {blocked.map((pathway) => {
              const material = inventory.find(
                (item) => item.revisionId === pathway.inventoryRevisionId,
              );
              const failed = pathway.gates.filter(
                (gate) => gate.status === "BLOCKED",
              );

              return (
                <li
                  className="grid gap-2 px-4 py-3.5 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] md:items-start"
                  key={pathway.id}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {pathway.subtype ?? label(pathway.materialFamily)}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-ink-muted">
                      {pathway.lotCode}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {failed.map((gate) => (
                      <li
                        className="grid grid-cols-[16px_minmax(0,1fr)] gap-2 text-[13px] leading-5 text-ink-muted"
                        key={gate.code}
                      >
                        <OctagonAlert
                          aria-hidden="true"
                          className="mt-[3px] text-blocked"
                          size={14}
                          strokeWidth={1.75}
                        />
                        <span>{gate.reason}</span>
                      </li>
                    ))}
                  </ul>
                  {material ? (
                    <Link
                      className={quietControl}
                      href={`/projects/${project.id}/review/${material.candidateThreadId}`}
                    >
                      Review item
                      <ArrowRight
                        aria-hidden="true"
                        size={14}
                        strokeWidth={1.75}
                      />
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Panel>
      ) : null}

      <Panel
        status={
          <StatusTag tone={blocked.length ? "attention" : "verified"}>
            {inventory.length}{" "}
            {inventory.length === 1 ? "material" : "materials"}
          </StatusTag>
        }
        title="Confirmed materials"
        titleId="confirmed-materials"
      >
        <div className="hidden grid-cols-[110px_minmax(0,1fr)_140px_minmax(0,220px)_120px] gap-4 border-b border-rule bg-paper-subtle px-4 py-2 font-mono text-[10px] tracking-[0.08em] text-ink-muted uppercase lg:grid">
          <span>Reference</span>
          <span>Material</span>
          <span>Quantity</span>
          <span>Recommended action</span>
          <span>Status</span>
        </div>
        <ol className="divide-y divide-rule">
          {inventory.map((item) => {
            const pathway = pathwaysByRevision.get(item.revisionId);
            const itemBlocked = pathway?.gates.some(
              (gate) => gate.status === "BLOCKED",
            );

            return (
              <li
                className="grid gap-x-4 gap-y-2 px-4 py-3.5 lg:grid-cols-[110px_minmax(0,1fr)_140px_minmax(0,220px)_120px] lg:items-baseline"
                key={item.revisionId}
              >
                <p className="font-mono text-[11px] font-medium">
                  {item.lotCode}
                </p>
                <div>
                  <Link
                    className="text-sm font-semibold transition-colors duration-150 hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    href={`/projects/${project.id}/review/${item.candidateThreadId}`}
                  >
                    {item.subtype ?? label(item.materialFamily)}
                  </Link>
                  {item.condition.value ? (
                    <p className="mt-0.5 text-[13px] text-ink-muted">
                      {item.condition.value}
                    </p>
                  ) : null}
                </div>
                <p className="font-mono text-[13px] tabular-nums">
                  {quantityLabel(item)}
                </p>
                <p className="text-[13px] font-medium">
                  {pathway
                    ? label(pathway.preferredPathway)
                    : "Preparing recommendation"}
                </p>
                <StatusTag
                  tone={
                    itemBlocked ? "blocked" : pathway ? "verified" : "neutral"
                  }
                >
                  {itemBlocked
                    ? "Needs attention"
                    : pathway
                      ? "Ready"
                      : "Preparing"}
                </StatusTag>
              </li>
            );
          })}
        </ol>
      </Panel>

      <Panel
        actions={
          reviewComplete && planIsCurrent && plan ? (
            approved ? (
              <Link
                className={primaryControl}
                href={`/api/v1/projects/${project.id}/plans/${plan.id}/print`}
                target="_blank"
              >
                <Printer aria-hidden="true" size={15} strokeWidth={1.75} />
                Print plan
              </Link>
            ) : (
              <RecoveryActionButton
                action="approve-plan"
                endpoint={`/api/v1/projects/${project.id}/plans/${plan.id}/approve`}
              />
            )
          ) : undefined
        }
        meta={
          planIsCurrent && plan
            ? `Revision ${String(plan.revisionNumber).padStart(2, "0")}`
            : undefined
        }
        status={
          <StatusTag
            tone={
              approved
                ? "verified"
                : !reviewComplete
                  ? "attention"
                  : planIsCurrent
                    ? "attention"
                    : "neutral"
            }
          >
            {approved
              ? "Approved"
              : !reviewComplete
                ? "Review incomplete"
                : planIsCurrent
                  ? "Awaiting approval"
                  : "Preparing"}
          </StatusTag>
        }
        title="Removal plan"
        titleId="removal-plan"
      >
        {reviewComplete && planIsCurrent && plan ? (
          <ol className="divide-y divide-rule">
            {plan.items.map((item) => (
              <li
                className="grid gap-x-4 gap-y-2 px-4 py-3.5 md:grid-cols-[32px_minmax(0,1fr)_minmax(0,180px)]"
                key={item.id}
              >
                <span className="font-mono text-[13px] font-medium text-ink-muted tabular-nums">
                  {String(item.sequence).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-sm font-semibold">
                      {item.subtype ?? label(item.materialFamily)}
                    </p>
                    <span className="font-mono text-[10px] text-ink-muted">
                      {item.lotCode}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-5 text-ink-muted">
                    {item.instructions.join(" ")}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      item.pathway === "SPECIALIST_REVIEW"
                        ? "text-blocked"
                        : "text-verified"
                    }`}
                  >
                    {label(item.pathway)}
                  </p>
                  {item.risks.length ? (
                    <p className="mt-1 text-[12px] leading-5 text-blocked">
                      {item.risks[0]}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            action={
              !reviewComplete ? (
                <Link
                  className={primaryControl}
                  href={`/projects/${project.id}/review`}
                >
                  Finish material review
                  <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
                </Link>
              ) : undefined
            }
          >
            {reviewComplete
              ? "ReBuild Loop is applying the current safety rules and preparing the removal sequence."
              : "The removal sequence will be prepared after every material proposal has a decision."}
          </EmptyState>
        )}
        {approved && plan?.approvedBy && plan.approvedAt ? (
          <p className="flex items-center gap-2 border-t border-rule px-4 py-3 text-[12px] text-verified">
            <CircleCheck aria-hidden="true" size={14} strokeWidth={1.75} />
            Approved by {plan.approvedBy} on{" "}
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(plan.approvedAt)}
          </p>
        ) : null}
      </Panel>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[280px] flex-1">
          <LimitationNote>
            Recommended actions support planning. They do not certify material
            fitness, safety, or compliance.
          </LimitationNote>
        </div>
        <Link className={quietControl} href={`/projects/${project.id}/audit`}>
          <History aria-hidden="true" size={15} strokeWidth={1.75} />
          Decision history
        </Link>
      </div>
    </div>
  );
}

function label(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function quantityLabel(item: MaterialLedgerItem) {
  const { min, max, unit = "units" } = item.quantity;
  if (typeof min === "number" && typeof max === "number") {
    return min === max ? `${min} ${unit}` : `${min} to ${max} ${unit}`;
  }
  if (typeof min === "number") return `${min}+ ${unit}`;
  if (typeof max === "number") return `up to ${max} ${unit}`;
  return "Not recorded";
}
