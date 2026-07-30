import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { StatusTag } from "@rebuild/ui";

import {
  primaryControl,
  secondaryControl,
} from "../../../components/workspace/controls";
import { EmptyState } from "../../../components/workspace/empty-state";
import { Panel } from "../../../components/workspace/panel";
import { projectStatusView } from "../../../lib/project-status";
import { listProjects } from "../../../lib/projects";
import { requireSession } from "../../../lib/session";

export const metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const session = await requireSession();
  const projectRows = await listProjects(session.user.id);

  return (
    <div className="mx-auto max-w-[1360px] px-5 py-7 md:px-8">
      <Panel
        actions={
          projectRows.length ? (
            <Link className={primaryControl} href="/projects/new">
              <Plus aria-hidden="true" size={15} strokeWidth={1.75} />
              New project
            </Link>
          ) : null
        }
        status={
          projectRows.length ? (
            <StatusTag>
              {projectRows.length}{" "}
              {projectRows.length === 1 ? "project" : "projects"}
            </StatusTag>
          ) : null
        }
        title="Projects"
        titleId="projects"
      >
        {projectRows.length === 0 ? (
          <EmptyState
            action={
              <div className="flex flex-wrap gap-2">
                <Link className={primaryControl} href="/projects/new">
                  Create a project
                </Link>
                <Link className={secondaryControl} href="/projects/demo/review">
                  Open demonstration
                </Link>
              </div>
            }
          >
            No projects yet. Start with a short site brief — ReBuild Loop then
            guides the evidence needed before material review can begin.
          </EmptyState>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_120px_minmax(0,1fr)_100px_20px] gap-4 border-b border-rule bg-paper-subtle px-4 py-2 font-mono text-[10px] tracking-[0.08em] text-ink-muted uppercase md:grid">
              <span>Project / site</span>
              <span>Stage</span>
              <span>Next action</span>
              <span className="text-right">Updated</span>
              <span />
            </div>
            <ol className="divide-y divide-rule">
              {projectRows.map((project) => {
                const status = projectStatusView(project.status);
                return (
                  <li key={project.id}>
                    <Link
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 hover:bg-paper-subtle focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus md:grid-cols-[minmax(0,1.5fr)_120px_minmax(0,1fr)_100px_20px]"
                      href={`/projects/${project.id}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="truncate text-sm font-semibold">
                            {project.name}
                          </p>
                          <span className="shrink-0 font-mono text-[10px] text-ink-muted">
                            {project.code}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                          {project.siteName} · {project.locationText}
                        </p>
                      </div>
                      <StatusTag tone={status.tone}>{status.label}</StatusTag>
                      <p className="text-[13px] md:font-medium">
                        {status.next}
                      </p>
                      <time
                        className="font-mono text-[11px] text-ink-muted tabular-nums md:text-right"
                        dateTime={project.updatedAt.toISOString()}
                      >
                        {project.updatedAt.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                      <ChevronRight
                        aria-hidden="true"
                        className="hidden shrink-0 text-ink-muted transition-colors duration-150 group-hover:text-action md:block"
                        size={16}
                        strokeWidth={1.75}
                      />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </Panel>
    </div>
  );
}
