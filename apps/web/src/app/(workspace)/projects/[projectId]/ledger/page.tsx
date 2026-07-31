import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { primaryControl } from "../../../../../components/workspace/controls";
import { EmptyState } from "../../../../../components/workspace/empty-state";
import { LimitationNote } from "../../../../../components/workspace/limitation-note";
import { Panel } from "../../../../../components/workspace/panel";
import { findOwnedProject } from "../../../../../lib/projects";
import {
  listConfirmedInventory,
  type MaterialLedgerItem,
} from "../../../../../lib/recovery";
import { requireSession } from "../../../../../lib/session";

export const metadata = {
  title: "Materials ledger",
};

export default async function MaterialLedgerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);
  if (!project) notFound();

  const items = await listConfirmedInventory(project.id, session.user.id);

  if (!items.length) {
    return (
      <div className="max-w-[880px] space-y-4">
        <Panel title="Confirmed lots" titleId="lots">
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
            No confirmed lots yet. Accept or correct a proposal in review to
            create one. Proposals never enter this ledger on their own.
          </EmptyState>
        </Panel>
      </div>
    );
  }

  const recovery = items.filter((item) => item.lane === "RECOVERY");
  const rubble = items.filter((item) => item.lane === "RUBBLE");

  return (
    <div className="space-y-4">
      <LedgerLane
        items={recovery}
        title="Reuse and recovery"
        titleId="lane-recovery"
      />
      <LedgerLane
        items={rubble}
        title="EPR-relevant rubble"
        titleId="lane-rubble"
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[280px] flex-1">
          <LimitationNote>
            Only accepted or corrected observations appear here. The two lanes
            keep reusable components separate from EPR-relevant mineral
            material; neither implies certification or a confirmed destination.
            Fire-rating, hazard, structural-role, and specialist unknowns are
            applied as gates at the route stage.
          </LimitationNote>
        </div>
        <Link
          className={primaryControl}
          href={`/projects/${project.id}/routes`}
        >
          Recovery routes
          <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}

function LedgerLane({
  items,
  title,
  titleId,
}: {
  items: MaterialLedgerItem[];
  title: string;
  titleId: string;
}) {
  const gated = items.filter(isGated).length;

  return (
    <Panel
      status={
        items.length ? (
          <StatusTag tone={gated ? "attention" : "verified"}>
            {items.length} {items.length === 1 ? "lot" : "lots"}
            {gated ? ` · ${gated} gated` : ""}
          </StatusTag>
        ) : null
      }
      title={title}
      titleId={titleId}
    >
      {items.length ? (
        <>
          <div className="hidden grid-cols-[110px_minmax(0,1fr)_150px_minmax(0,200px)] gap-4 border-b border-rule bg-paper-subtle px-4 py-2 font-mono text-[10px] tracking-[0.08em] text-ink-muted uppercase lg:grid">
            <span>Lot</span>
            <span>Material</span>
            <span>Quantity</span>
            <span>Route readiness</span>
          </div>
          <ol className="divide-y divide-rule">
            {items.map((item) => (
              <li
                className="grid gap-x-4 gap-y-2 px-4 py-3.5 lg:grid-cols-[110px_minmax(0,1fr)_150px_minmax(0,200px)] lg:items-baseline"
                key={item.revisionId}
              >
                <div className="flex items-baseline gap-2 lg:block">
                  <p className="font-mono text-[11px] font-medium">
                    {item.lotCode}
                  </p>
                  <p className="font-mono text-[10px] text-ink-muted tabular-nums lg:mt-0.5">
                    rev {String(item.revisionNumber).padStart(2, "0")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {item.subtype ?? label(item.materialFamily)}
                  </p>
                  {item.condition.value ? (
                    <p className="mt-0.5 text-[13px] text-ink-muted">
                      {item.condition.value}
                    </p>
                  ) : null}
                </div>
                <p className="font-mono text-[13px] tabular-nums">
                  {quantityLabel(item)}
                </p>
                <div>
                  <StatusTag tone={isGated(item) ? "attention" : "verified"}>
                    {isGated(item) ? "Gate required" : "Ready"}
                  </StatusTag>
                  {item.unknowns[0] ? (
                    <p className="mt-1.5 text-[12px] leading-5 text-ink-muted">
                      {item.unknowns[0]}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <EmptyState>No confirmed lots in this lane.</EmptyState>
      )}
    </Panel>
  );
}

function isGated(item: MaterialLedgerItem): boolean {
  return item.specialistReviewRequired || item.unknowns.length > 0;
}

function quantityLabel(item: MaterialLedgerItem) {
  const { min, max, unit = "units" } = item.quantity;
  if (typeof min === "number" && typeof max === "number") {
    return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
  }
  return "Not set";
}

function label(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}
