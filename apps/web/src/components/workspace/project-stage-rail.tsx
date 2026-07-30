"use client";

import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STAGES = [
  { key: "brief", label: "Brief", name: "Site brief" },
  { key: "capture", label: "Capture", name: "Capture" },
  { key: "review", label: "Review", name: "Review" },
  { key: "ledger", label: "Ledger", name: "Materials ledger" },
  { key: "routes", label: "Routes", name: "Recovery routes" },
  { key: "pack", label: "Pack", name: "Recovery pack" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

/**
 * The single stage indicator for a project.
 *
 * Derives the active stage from the pathname so no page has to declare its own
 * position, and so nested routes (an analysis run, a candidate, the audit
 * trail) resolve to the stage they belong to.
 */
export function ProjectStageRail({
  projectId,
  projectStatus,
}: {
  projectId: string;
  projectStatus: string;
}) {
  const pathname = usePathname();
  const current = currentStage(pathname, projectId);
  const currentIndex = STAGES.findIndex((stage) => stage.key === current);
  const unlockedThrough = unlockedStages(projectStatus);

  return (
    <nav aria-label="Project stages">
      <ol className="-mb-px flex overflow-x-auto">
        {STAGES.map((stage, index) => {
          const isCurrent = stage.key === current;
          const isDone = currentIndex >= 0 && index < currentIndex;
          const isUnlocked = index < unlockedThrough || isCurrent;

          const marker = isDone ? (
            <Check
              aria-hidden="true"
              className="text-verified"
              size={13}
              strokeWidth={2}
            />
          ) : isCurrent ? (
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-action"
            />
          ) : isUnlocked ? null : (
            <Lock aria-hidden="true" size={11} strokeWidth={1.75} />
          );

          const inner = (
            <>
              {marker ? (
                <span className="flex w-4 shrink-0 justify-center">
                  {marker}
                </span>
              ) : null}
              {stage.label}
            </>
          );

          return (
            <li key={stage.key}>
              {isUnlocked ? (
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-2 border-b-2 px-3 text-[12px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus ${
                    isCurrent
                      ? "border-action text-ink"
                      : "border-transparent text-ink-muted hover:text-ink"
                  }`}
                  href={stageHref(projectId, stage.key)}
                >
                  {inner}
                </Link>
              ) : (
                <span
                  className="flex min-h-10 cursor-default items-center gap-2 border-b-2 border-transparent px-3 text-[12px] font-medium whitespace-nowrap text-ink-muted/60"
                  title={`${stage.name} — ${blockingReason(index)}`}
                >
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function stageHref(projectId: string, stage: StageKey) {
  return stage === "brief"
    ? `/projects/${projectId}`
    : `/projects/${projectId}/${stage}`;
}

function currentStage(pathname: string, projectId: string): StageKey | null {
  const segment = pathname
    .replace(`/projects/${projectId}`, "")
    .split("/")
    .filter(Boolean)[0];

  switch (segment) {
    case undefined:
      return "brief";
    // An analysis run is the tail of capture, and the audit trail is reached
    // from the pack, so both keep their originating stage marked.
    case "analysis":
    case "capture":
      return "capture";
    case "review":
      return "review";
    case "ledger":
      return "ledger";
    case "routes":
      return "routes";
    case "audit":
    case "pack":
      return "pack";
    default:
      return null;
  }
}

function unlockedStages(status: string): number {
  switch (status) {
    case "APPROVED":
    case "PLAN_DRAFTED":
      return 6;
    case "INVENTORY_CONFIRMED":
      return 5;
    case "REVIEW_REQUIRED":
      return 4;
    default:
      return 3;
  }
}

function blockingReason(index: number): string {
  if (index === 3) return "accept a proposal in review first";
  if (index === 4) return "confirm a material lot first";
  return "calculate recovery routes first";
}
