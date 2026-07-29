import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

import { StatusTag } from "@rebuild/ui";

import { listProjects } from "../../../lib/projects";
import { requireSession } from "../../../lib/session";

const statusCopy = {
  APPROVED: ["Approved", "Recovery pack approved", "verified"],
  ANALYSING: ["Analysing", "Evidence analysis is running", "evidence"],
  DRAFT: ["Site brief", "Add initial site evidence", "attention"],
  INTAKE_READY: ["Capture", "Evidence is ready for analysis", "evidence"],
  INVENTORY_CONFIRMED: [
    "Materials ledger",
    "Calculate recovery routes",
    "verified",
  ],
  PLAN_DRAFTED: ["Recovery pack", "Review and approve the plan", "attention"],
  REVIEW_REQUIRED: ["Review", "Material proposals need decisions", "attention"],
} as const;

export const metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const session = await requireSession();
  const projectRows = await listProjects(session.user.id);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-col justify-between gap-5 border-b border-rule pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-medium tracking-[0.12em] text-action uppercase">
            Project register
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.035em] md:text-4xl">
            Projects
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
            Continue the next evidence, review, or approval action for each
            site.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full border border-action bg-action px-5 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          href="/projects/new"
        >
          <Plus aria-hidden="true" size={17} strokeWidth={1.75} />
          New project
        </Link>
      </div>

      {projectRows.length === 0 ? (
        <section className="mt-8 border border-rule bg-paper">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_260px] md:p-9">
            <div>
              <p className="font-mono text-xs text-ink-muted">
                REGISTER / EMPTY
              </p>
              <h2 className="mt-3 font-heading text-2xl font-bold">
                No projects yet.
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-ink-muted">
                Start with a short site brief. ReBuild Loop will then guide the
                evidence needed before material review can begin.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-action bg-action px-5 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  href="/projects/new"
                >
                  Create your first project
                  <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-action bg-paper px-5 text-sm font-semibold text-action transition-colors hover:bg-brand-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  href="/projects/demo/review"
                >
                  Open demonstration
                </Link>
              </div>
            </div>
            <ol className="border-l border-rule pl-6 text-sm text-ink-muted">
              {[
                "Save the site brief",
                "Capture useful evidence",
                "Review model proposals",
                "Approve a recovery plan",
              ].map((item, index) => (
                <li className="relative pb-5 last:pb-0" key={item}>
                  <span className="absolute top-0 -left-[37px] flex size-6 items-center justify-center rounded-full border border-rule bg-paper font-mono text-[10px] text-ink">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : (
        <section className="mt-8 border border-rule bg-paper">
          <div className="hidden grid-cols-[1.4fr_0.65fr_1fr_auto] gap-5 border-b border-rule bg-paper-subtle px-5 py-3 font-mono text-[11px] font-medium tracking-[0.08em] text-ink-muted uppercase md:grid">
            <span>Project / site</span>
            <span>Stage</span>
            <span>Next required action</span>
            <span className="text-right">Updated</span>
          </div>
          <ol className="divide-y divide-rule">
            {projectRows.map((project) => {
              const [stage, nextAction, tone] = statusCopy[project.status];
              return (
                <li key={project.id}>
                  <Link
                    className="group grid gap-4 px-5 py-5 transition-colors hover:bg-brand-light focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus md:grid-cols-[1.4fr_0.65fr_1fr_auto] md:items-center"
                    href={`/projects/${project.id}`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-heading text-lg font-semibold">
                          {project.name}
                        </p>
                        <span className="font-mono text-[10px] text-ink-muted">
                          {project.code}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">
                        {project.siteName} · {project.locationText}
                      </p>
                    </div>
                    <div>
                      <StatusTag tone={tone}>{stage}</StatusTag>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{nextAction}</p>
                      <ArrowRight
                        aria-hidden="true"
                        className="shrink-0 text-action transition-transform group-hover:translate-x-1 md:hidden"
                        size={17}
                      />
                    </div>
                    <time
                      className="font-mono text-xs text-ink-muted md:text-right"
                      dateTime={project.updatedAt.toISOString()}
                    >
                      {project.updatedAt.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
