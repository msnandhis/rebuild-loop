import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { ProjectStageRail } from "../../../../components/workspace/project-stage-rail";
import { projectStatusView } from "../../../../lib/project-status";
import { findOwnedProject } from "../../../../lib/projects";
import { requireSession } from "../../../../lib/session";

/**
 * The project shell. Every stage screen inherits its identity and stage
 * position from here, so no page repeats the project code, a back link, or its
 * own stage indicator.
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);

  if (!project) {
    notFound();
  }

  const status = projectStatusView(project.status);
  const workDate = project.plannedWorkDate
    ? new Date(`${project.plannedWorkDate}T00:00:00`).toLocaleDateString(
        "en-IN",
        { day: "2-digit", month: "short", year: "numeric" },
      )
    : null;

  return (
    <>
      <div className="border-b border-rule bg-paper md:sticky md:top-14 md:z-30">
        <div className="mx-auto max-w-[1360px] px-5 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 pt-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <h1 className="truncate text-base font-semibold tracking-[-0.01em]">
                {project.name}
              </h1>
              <span className="hidden shrink-0 font-mono text-[10px] text-ink-muted sm:inline">
                {project.code}
              </span>
              <StatusTag tone={status.tone}>{status.label}</StatusTag>
            </div>
            <p className="hidden truncate text-[12px] text-ink-muted lg:block">
              {[project.siteName, project.locationText, workDate]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <p className="mt-1 truncate text-[12px] text-ink-muted lg:hidden">
            {[project.siteName, project.locationText, workDate]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-1.5">
            <ProjectStageRail
              projectId={project.id}
              projectStatus={project.status}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1360px] px-5 py-6 md:px-8">{children}</div>
    </>
  );
}
