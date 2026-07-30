import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { primaryControl } from "../../../../../components/workspace/controls";
import { EmptyState } from "../../../../../components/workspace/empty-state";
import { LimitationNote } from "../../../../../components/workspace/limitation-note";
import { Panel } from "../../../../../components/workspace/panel";
import { listCandidates } from "../../../../../lib/candidates";
import { findOwnedProject } from "../../../../../lib/projects";
import { requireSession } from "../../../../../lib/session";

export default async function ReviewQueuePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);

  if (!project) {
    notFound();
  }

  const candidates = await listCandidates(projectId, session.user.id);
  const undecided = candidates.filter(
    (candidate) => !candidate.latest_decision_action,
  ).length;

  return (
    <div className="space-y-4">
      <Panel
        status={
          candidates.length ? (
            <StatusTag tone={undecided ? "attention" : "verified"}>
              {undecided ? `${undecided} awaiting decision` : "All decided"}
            </StatusTag>
          ) : null
        }
        title="Model proposals"
        titleId="proposals"
      >
        {candidates.length ? (
          <ol className="divide-y divide-rule">
            {candidates.map((candidate) => {
              const unknowns = toStringArray(candidate.unknowns);
              const decision = candidate.latest_decision_action;

              return (
                <li key={candidate.candidate_thread_id}>
                  <Link
                    className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 hover:bg-paper-subtle focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus md:grid-cols-[96px_minmax(0,1fr)_minmax(0,0.8fr)_120px_20px]"
                    href={`/projects/${projectId}/review/${candidate.candidate_thread_id}`}
                  >
                    <span className="order-2 font-mono text-[11px] text-ink-muted md:order-none">
                      MAT-
                      {candidate.candidate_thread_id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className="order-1 text-sm font-semibold md:order-none">
                      {candidate.subtype ?? candidate.material_family}
                    </span>
                    <span className="order-3 line-clamp-2 text-[13px] leading-5 text-ink-muted md:order-none">
                      {candidate.observation_summary}
                    </span>
                    <span className="order-4 md:order-none">
                      {decision ? (
                        <StatusTag tone={decisionTone(decision)}>
                          {humanize(decision)}
                        </StatusTag>
                      ) : unknowns.length ? (
                        <StatusTag tone="attention">
                          {unknowns.length} unknown
                          {unknowns.length === 1 ? "" : "s"}
                        </StatusTag>
                      ) : (
                        <StatusTag>No decision</StatusTag>
                      )}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="order-5 hidden shrink-0 text-ink-muted transition-colors duration-150 group-hover:text-action md:order-none md:block"
                      size={16}
                      strokeWidth={1.75}
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState
            action={
              <Link
                className={primaryControl}
                href={`/projects/${projectId}/capture`}
              >
                Add evidence
              </Link>
            }
          >
            No proposals yet. Add site evidence and complete an analysis run.
          </EmptyState>
        )}
      </Panel>

      <LimitationNote>
        Every row is a preliminary model proposal, not a finding. Open one to
        inspect its source evidence and unresolved questions; nothing reaches
        the materials ledger until you accept or correct it.
      </LimitationNote>
    </div>
  );
}

function decisionTone(action: string) {
  if (action === "CONFIRMED" || action === "CORRECTED") return "verified";
  if (action === "SPECIALIST_REVIEW") return "blocked";
  return "attention";
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
