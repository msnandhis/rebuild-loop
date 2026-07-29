import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { findOwnedProject } from "../../../../lib/projects";
import { requireSession } from "../../../../lib/session";

const stages = [
  ["01", "Site brief", "done"],
  ["02", "Capture", "current"],
  ["03", "Review", "blocked"],
  ["04", "Materials ledger", "blocked"],
  ["05", "Recovery routes", "blocked"],
  ["06", "Recovery pack", "blocked"],
] as const;

export default async function ProjectPage({
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

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8 md:py-12">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        href="/projects"
      >
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
        Project register
      </Link>

      <header className="mt-5 border-y border-rule bg-paper">
        <div className="px-5 py-6 md:px-7">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-ink-muted">
                {project.code}
              </span>
              <StatusTag tone="attention">Capture required</StatusTag>
            </div>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em] md:text-4xl">
              {project.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-2">
                <MapPin aria-hidden="true" size={16} strokeWidth={1.75} />
                {project.siteName} · {project.locationText}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays aria-hidden="true" size={16} strokeWidth={1.75} />
                {project.plannedWorkDate
                  ? new Date(
                      `${project.plannedWorkDate}T00:00:00`,
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Work date not set"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border border-rule bg-paper">
          <div className="border-b border-rule px-4 py-3">
            <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-ink-muted uppercase">
              Project stages
            </p>
          </div>
          <ol className="divide-y divide-rule">
            {stages.map(([number, label, state]) => {
              const content = (
                <>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border font-mono text-[10px] ${
                      state === "current"
                        ? "border-action text-action"
                        : state === "done"
                          ? "border-verified text-verified"
                          : "border-rule text-ink-muted"
                    }`}
                  >
                    {state === "done" ? (
                      <Check aria-hidden="true" size={13} />
                    ) : (
                      number
                    )}
                  </span>
                  {label}
                </>
              );

              return (
                <li
                  className={`min-h-14 text-sm ${
                    state === "current"
                      ? "border-l-4 border-action bg-brand-wash font-semibold text-action"
                      : state === "done"
                        ? "font-medium text-verified"
                        : "text-ink-muted/65"
                  }`}
                  key={number}
                >
                  {state === "current" ? (
                    <Link
                      className="grid min-h-14 grid-cols-[30px_1fr] items-center gap-2 px-4 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus"
                      href={`/projects/${project.id}/capture`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="grid min-h-14 grid-cols-[30px_1fr] items-center gap-2 px-4">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="border-t border-rule px-4 py-4 text-xs leading-5 text-ink-muted">
            Review and downstream stages unlock only when their source evidence
            is ready.
          </p>
        </aside>

        <div className="space-y-6">
          <section className="border border-rule bg-paper">
            <div className="border-b border-rule px-5 py-4 md:px-6">
              <p className="font-mono text-[11px] text-ink-muted">
                CURRENT ACTION / 02
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold">
                Add the initial evidence set.
              </h2>
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-6">
              <div>
                <p className="max-w-2xl leading-7 text-ink-muted">
                  The site brief and ownership boundary are active. Collect
                  clear site images that show overall context, connections,
                  condition, labels, and a known scale.
                </p>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="border-l-2 border-rule pl-3">
                    <dt className="text-ink-muted">Project type</dt>
                    <dd className="mt-1 font-semibold">
                      {project.type === "MIXED"
                        ? "Mixed renovation and demolition"
                        : project.type === "RENOVATION"
                          ? "Renovation / strip-out"
                          : "Demolition"}
                    </dd>
                  </div>
                  <div className="border-l-2 border-rule pl-3">
                    <dt className="text-ink-muted">Scale / scope</dt>
                    <dd className="mt-1 font-semibold">
                      {project.scaleNote || "Not stated"}
                    </dd>
                  </div>
                </dl>
              </div>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-action bg-action px-5 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                href={`/projects/${project.id}/capture`}
              >
                Prepare evidence
                <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
