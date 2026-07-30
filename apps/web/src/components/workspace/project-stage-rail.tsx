"use client";

import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
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

/**
 * A quiet end-of-page continuation for the same stages shown in the rail.
 *
 * Page-specific actions still own the primary workflow decision. This pager
 * only removes the need to scroll back to the rail after a stage is complete.
 */
export function ProjectStagePager({
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

  if (currentIndex < 0) {
    return null;
  }

  const previous = STAGES[currentIndex - 1];
  const next = STAGES[currentIndex + 1];
  const nextIsUnlocked = next ? currentIndex + 1 < unlockedThrough : false;

  return (
    <nav
      aria-label="Move between project stages"
      className="mt-8 border-t border-rule pt-4"
    >
      <div className="flex items-stretch justify-between gap-3">
        {previous ? (
          <StagePagerLink
            direction="previous"
            href={stageHref(projectId, previous.key)}
            name={previous.name}
          />
        ) : (
          <span aria-hidden="true" />
        )}

        {next ? (
          nextIsUnlocked ? (
            <StagePagerLink
              direction="next"
              href={stageHref(projectId, next.key)}
              name={next.name}
            />
          ) : (
            <span
              aria-disabled="true"
              className="flex min-h-12 min-w-0 max-w-[18rem] cursor-not-allowed items-center justify-end gap-3 rounded-lg border border-rule bg-paper-subtle px-3 py-2 text-right text-ink-muted/70"
              role="link"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-medium">
                  Next step locked
                </span>
                <span className="block text-sm font-semibold text-ink-muted">
                  {blockingReason(currentIndex + 1)}
                </span>
              </span>
              <Lock
                aria-hidden="true"
                className="shrink-0"
                size={16}
                strokeWidth={1.75}
              />
            </span>
          )
        ) : null}
      </div>
    </nav>
  );
}

function StagePagerLink({
  direction,
  href,
  name,
}: {
  direction: "next" | "previous";
  href: string;
  name: string;
}) {
  const isPrevious = direction === "previous";

  return (
    <Link
      className={`flex min-h-12 min-w-0 max-w-[18rem] items-center gap-3 rounded-lg border border-rule bg-paper px-3 py-2 text-ink transition-colors duration-150 hover:border-rule-strong hover:bg-paper-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
        isPrevious ? "" : "ml-auto text-right"
      }`}
      href={href}
    >
      {isPrevious ? (
        <ArrowLeft
          aria-hidden="true"
          className="shrink-0 text-ink-muted"
          size={17}
          strokeWidth={1.75}
        />
      ) : null}
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-ink-muted">
          {isPrevious ? "Previous" : "Next"}
        </span>
        <span className="block text-sm font-semibold">{name}</span>
      </span>
      {isPrevious ? null : (
        <ArrowRight
          aria-hidden="true"
          className="shrink-0 text-action"
          size={17}
          strokeWidth={1.75}
        />
      )}
    </Link>
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
