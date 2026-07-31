import { ArrowRight, CircleCheck, OctagonAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { RecoveryActionButton } from "../../../../../components/recovery/recovery-actions";
import { primaryControl } from "../../../../../components/workspace/controls";
import { EmptyState } from "../../../../../components/workspace/empty-state";
import { LimitationNote } from "../../../../../components/workspace/limitation-note";
import { Panel } from "../../../../../components/workspace/panel";
import { findOwnedProject } from "../../../../../lib/projects";
import {
  listConfirmedInventory,
  listPathwayAssessments,
} from "../../../../../lib/recovery";
import { requireSession } from "../../../../../lib/session";

export const metadata = {
  title: "Recovery routes",
};

export default async function RecoveryRoutesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);
  if (!project) notFound();

  const [inventory, sheets] = await Promise.all([
    listConfirmedInventory(project.id, session.user.id),
    listPathwayAssessments(project.id, session.user.id),
  ]);
  const blocked = sheets.filter((sheet) =>
    sheet.gates.some((gate) => gate.status === "BLOCKED"),
  ).length;

  return (
    <div className="space-y-4">
      <Panel
        actions={
          <RecoveryActionButton
            action="calculate-pathways"
            disabled={!inventory.length}
            endpoint={`/api/v1/projects/${project.id}/pathways`}
          />
        }
        status={
          sheets.length ? (
            <StatusTag tone={blocked ? "blocked" : "verified"}>
              {blocked
                ? `${blocked} specialist ${blocked === 1 ? "block" : "blocks"}`
                : "Gates passed"}
            </StatusTag>
          ) : (
            <StatusTag tone="attention">Not calculated</StatusTag>
          )
        }
        title="Route sheets"
        titleId="route-sheets"
      >
        {!inventory.length ? (
          <EmptyState
            action={
              <Link
                className={primaryControl}
                href={`/projects/${project.id}/review`}
              >
                Go to review
              </Link>
            }
          >
            No confirmed lot exists yet. Accept or correct a proposal before
            applying recovery rules.
          </EmptyState>
        ) : !sheets.length ? (
          <EmptyState>
            Apply the current rule version to expose every passed and blocked
            gate. The calculation is repeatable. A changed decision produces a
            new source hash and needs a fresh assessment.
          </EmptyState>
        ) : (
          <ol className="divide-y divide-rule">
            {sheets.map((sheet) => {
              const failed = sheet.gates.filter(
                (gate) => gate.status === "BLOCKED",
              );

              return (
                <li className="px-4 py-4" key={sheet.id}>
                  <div className="grid gap-x-4 gap-y-2 lg:grid-cols-[110px_minmax(0,1fr)_minmax(0,220px)] lg:items-baseline">
                    <div className="flex items-baseline gap-2 lg:block">
                      <p className="font-mono text-[11px] font-medium">
                        {sheet.lotCode}
                      </p>
                      <p className="font-mono text-[10px] text-ink-muted lg:mt-0.5">
                        {sheet.ruleVersion}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {sheet.subtype ?? label(sheet.materialFamily)}
                      </p>
                      <p className="mt-0.5 max-w-[70ch] text-[13px] leading-5 text-ink-muted">
                        {sheet.explanation}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          failed.length ? "text-blocked" : "text-verified"
                        }`}
                      >
                        {label(sheet.preferredPathway)}
                      </p>
                      {sheet.alternativePathway ? (
                        <p className="mt-0.5 text-[12px] text-ink-muted">
                          Alternative: {label(sheet.alternativePathway)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-x-6 gap-y-3 lg:grid-cols-2 lg:pl-[126px]">
                    <ul className="space-y-1.5">
                      {sheet.gates.map((gate) => {
                        const isBlocked = gate.status === "BLOCKED";
                        return (
                          <li
                            className="grid grid-cols-[16px_minmax(0,1fr)] gap-2"
                            key={gate.code}
                          >
                            {isBlocked ? (
                              <OctagonAlert
                                aria-hidden="true"
                                className="mt-[3px] text-blocked"
                                size={14}
                                strokeWidth={1.75}
                              />
                            ) : (
                              <CircleCheck
                                aria-hidden="true"
                                className="mt-[3px] text-verified"
                                size={14}
                                strokeWidth={1.75}
                              />
                            )}
                            <p className="text-[13px] leading-5">
                              <span className="font-medium">{gate.label}</span>
                              <span className="text-ink-muted">
                                {": "}
                                {isBlocked ? gate.reason : "passed"}
                              </span>
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                    {sheet.preparationRequirements.length ? (
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.08em] text-ink-muted uppercase">
                          Preparation
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {sheet.preparationRequirements.map((requirement) => (
                            <li
                              className="text-[13px] leading-5 text-ink-muted"
                              key={requirement}
                            >
                              {requirement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[280px] flex-1">
          <LimitationNote>
            Versioned TypeScript rules, not the model, apply every safety gate.
            An unknown fire-rating, hazard, structural-role, or specialist fact
            blocks direct and same-site reuse. These are preliminary planning
            outputs and do not replace engineering, fire, hazard, or statutory
            review.
          </LimitationNote>
        </div>
        {sheets.length ? (
          <Link
            className={primaryControl}
            href={`/projects/${project.id}/pack`}
          >
            Recovery pack
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
          </Link>
        ) : null}
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
