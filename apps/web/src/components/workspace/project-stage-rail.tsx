"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STAGES = [
  { key: "overview", label: "Overview", name: "Project overview" },
  { key: "evidence", label: "Evidence", name: "Site evidence" },
  { key: "review", label: "Review", name: "Review materials" },
  { key: "plan", label: "Recovery plan", name: "Recovery plan" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

export function ProjectStageRail({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const current = currentStage(pathname, projectId);
  const currentIndex = STAGES.findIndex((stage) => stage.key === current);

  return (
    <nav aria-label="Project stages">
      <ol className="-mb-px flex overflow-x-auto">
        {STAGES.map((stage, index) => {
          const isCurrent = stage.key === current;
          const isDone = currentIndex >= 0 && index < currentIndex;
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
          ) : null;

          return (
            <li key={stage.key}>
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 border-b-2 px-3 text-[12px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus ${
                  isCurrent
                    ? "border-action text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
                href={stageHref(projectId, stage.key)}
              >
                {marker ? (
                  <span className="flex w-4 shrink-0 justify-center">
                    {marker}
                  </span>
                ) : null}
                {stage.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ProjectStagePager({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const current = currentStage(pathname, projectId);
  const currentIndex = STAGES.findIndex((stage) => stage.key === current);

  if (currentIndex < 0) {
    return null;
  }

  const previous = STAGES[currentIndex - 1];
  const next = STAGES[currentIndex + 1];

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
          <StagePagerLink
            direction="next"
            href={stageHref(projectId, next.key)}
            name={next.name}
          />
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
  switch (stage) {
    case "overview":
      return `/projects/${projectId}`;
    case "evidence":
      return `/projects/${projectId}/capture`;
    case "review":
      return `/projects/${projectId}/review`;
    case "plan":
      return `/projects/${projectId}/pack`;
  }
}

function currentStage(pathname: string, projectId: string): StageKey | null {
  const segment = pathname
    .replace(`/projects/${projectId}`, "")
    .split("/")
    .filter(Boolean)[0];

  switch (segment) {
    case undefined:
      return "overview";
    case "analysis":
    case "capture":
      return "evidence";
    case "review":
      return "review";
    case "audit":
    case "ledger":
    case "pack":
    case "routes":
      return "plan";
    default:
      return null;
  }
}
