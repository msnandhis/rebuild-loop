import { History, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { AuditTimeline } from "../../../../../components/recovery/audit-timeline";
import { RecoveryActionButton } from "../../../../../components/recovery/recovery-actions";
import {
  disabledControl,
  primaryControl,
  quietControl,
} from "../../../../../components/workspace/controls";
import { EmptyState } from "../../../../../components/workspace/empty-state";
import { LimitationNote } from "../../../../../components/workspace/limitation-note";
import { Panel } from "../../../../../components/workspace/panel";
import { findOwnedProject } from "../../../../../lib/projects";
import {
  findCurrentRecoveryPlan,
  listPathwayAssessments,
  listProjectAuditEvents,
} from "../../../../../lib/recovery";
import { requireSession } from "../../../../../lib/session";

export const metadata = {
  title: "Recovery plan",
};

export default async function RecoveryPackPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);
  if (!project) notFound();

  const [plan, pathways, events] = await Promise.all([
    findCurrentRecoveryPlan(project.id, session.user.id),
    listPathwayAssessments(project.id, session.user.id),
    listProjectAuditEvents(project.id, session.user.id, 10),
  ]);
  const approved = plan?.status === "APPROVED";

  return (
    <div className="space-y-4">
      <Panel
        actions={
          plan ? (
            approved ? (
              <Link
                className={primaryControl}
                href={`/api/v1/projects/${project.id}/plans/${plan.id}/print`}
                target="_blank"
              >
                <Printer aria-hidden="true" size={15} strokeWidth={1.75} />
                Print
              </Link>
            ) : (
              <>
                <span
                  className={disabledControl}
                  title="Print unlocks after named human approval."
                >
                  <Printer aria-hidden="true" size={15} strokeWidth={1.75} />
                  Print
                </span>
                <RecoveryActionButton
                  action="approve-plan"
                  endpoint={`/api/v1/projects/${project.id}/plans/${plan.id}/approve`}
                />
              </>
            )
          ) : (
            <RecoveryActionButton
              action="create-plan"
              disabled={!pathways.length}
              endpoint={`/api/v1/projects/${project.id}/plans`}
            />
          )
        }
        meta={plan ? plan.sourceHash.slice(0, 12) : undefined}
        status={
          <StatusTag
            tone={approved ? "verified" : plan ? "attention" : "neutral"}
          >
            {approved ? "Approved" : plan ? "Awaiting approval" : "Not drafted"}
          </StatusTag>
        }
        title={
          plan
            ? `Recovery sequence ${String(plan.revisionNumber).padStart(2, "0")}`
            : "Recovery pack"
        }
        titleId="pack"
      >
        {!plan ? (
          <EmptyState>
            {pathways.length
              ? "Every confirmed lot has a current route sheet. Draft a controlled revision to record the deconstruction sequence."
              : "Calculate a route sheet for every confirmed lot before drafting a pack."}
          </EmptyState>
        ) : (
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
                  {item.instructions.length ? (
                    <ol className="mt-1 max-w-[70ch] space-y-0.5">
                      {item.instructions.map((instruction) => (
                        <li
                          className="text-[13px] leading-5 text-ink-muted"
                          key={instruction}
                        >
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {item.risks.length ? (
                    <p className="mt-1.5 border-l-2 border-blocked pl-2.5 text-[12px] leading-5 text-blocked">
                      {item.risks.join(" ")}
                    </p>
                  ) : null}
                </div>
                <p
                  className={`text-sm font-semibold ${
                    item.pathway === "SPECIALIST_REVIEW"
                      ? "text-blocked"
                      : "text-verified"
                  }`}
                >
                  {label(item.pathway)}
                </p>
              </li>
            ))}
          </ol>
        )}
        {plan?.approvedBy && plan.approvedAt ? (
          <p className="border-t border-rule px-4 py-2.5 text-[12px] text-ink-muted">
            Approved by {plan.approvedBy} ·{" "}
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(plan.approvedAt)}
          </p>
        ) : null}
      </Panel>

      <Panel
        actions={
          <Link className={quietControl} href={`/projects/${project.id}/audit`}>
            <History aria-hidden="true" size={15} strokeWidth={1.75} />
            Full timeline
          </Link>
        }
        title="Recent activity"
        titleId="activity"
      >
        <AuditTimeline events={events} limit={5} />
      </Panel>

      <LimitationNote>
        The pack links every instruction to a confirmed material revision and a
        deterministic route sheet, and the source hash prevents an old pack from
        surviving changed decisions. Approval records your name and timestamp
        against this preliminary workflow record. It does not confirm material
        fitness or compliance, and a qualified professional must resolve
        safety-critical unknowns before any reuse.
      </LimitationNote>
    </div>
  );
}

function label(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}
