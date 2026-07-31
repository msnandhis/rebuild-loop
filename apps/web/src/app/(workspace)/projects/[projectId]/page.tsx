import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { primaryControl } from "../../../../components/workspace/controls";
import { LimitationNote } from "../../../../components/workspace/limitation-note";
import type { ProjectStatus } from "../../../../lib/project-status";
import {
  findActiveProjectAnalysis,
  findOwnedProject,
} from "../../../../lib/projects";
import { requireSession } from "../../../../lib/session";

export const metadata = {
  title: "Site brief",
};

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

  const activeAnalysis =
    project.status === "ANALYSING"
      ? await findActiveProjectAnalysis(project.id, session.user.id)
      : null;
  const next = nextAction(
    project.status as ProjectStatus,
    project.id,
    activeAnalysis?.id,
  );

  return (
    <div className="max-w-[960px] space-y-4">
      <section className="grid border border-rule bg-paper md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-44 flex-col items-start justify-between gap-6 border-b border-rule p-5 md:border-r md:border-b-0 md:p-6">
          <div>
            <p className="text-[12px] font-semibold text-ink-muted">Up next</p>
            <h2 className="mt-2 max-w-[24ch] font-heading text-2xl font-bold tracking-[-0.025em]">
              {next.action}
            </h2>
            <p className="mt-2 max-w-[52ch] text-sm leading-6 text-ink-muted">
              {next.description}
            </p>
          </div>
          <Link className={primaryControl} href={next.href}>
            Continue
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
          </Link>
        </div>
        <div>
          <h2
            className="border-b border-rule px-4 py-3 text-[13px] font-semibold"
            id="site-brief"
          >
            Site brief
          </h2>
          <dl className="divide-y divide-rule">
            <BriefRow label="Project type" value={projectType(project.type)} />
            <BriefRow label="Scale and scope" value={project.scaleNote} />
            <BriefRow label="Site" value={project.siteName} />
            <BriefRow label="Location" value={project.locationText} />
          </dl>
        </div>
      </section>

      <LimitationNote>
        Review and every downstream stage unlock only once their source evidence
        exists. ReBuild Loop records preliminary recovery planning; it does not
        certify material fitness, and a qualified professional must resolve
        safety-critical unknowns before any reuse.
      </LimitationNote>
    </div>
  );
}

function BriefRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 px-4 py-2.5">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className={value ? "text-sm" : "text-sm text-ink-muted"}>
        {value || "Not stated"}
      </dd>
    </div>
  );
}

function projectType(type: string): string {
  if (type === "MIXED") return "Mixed renovation and demolition";
  if (type === "RENOVATION") return "Renovation / strip-out";
  return "Demolition";
}

function nextAction(
  status: ProjectStatus,
  projectId: string,
  activeAnalysisId?: string,
) {
  switch (status) {
    case "ANALYSING":
      return {
        action: activeAnalysisId ? "View run" : "View evidence",
        description:
          "An analysis is running. You can leave it and return to the same record.",
        href: activeAnalysisId
          ? `/projects/${projectId}/analysis/${activeAnalysisId}`
          : `/projects/${projectId}/capture`,
      };
    case "REVIEW_REQUIRED":
      return {
        action: "Review proposals",
        description:
          "Check each proposal against its source evidence before deciding.",
        href: `/projects/${projectId}/review`,
      };
    case "INVENTORY_CONFIRMED":
      return {
        action: "Open ledger",
        description: "Confirmed lots are ready for route calculation.",
        href: `/projects/${projectId}/ledger`,
      };
    case "PLAN_DRAFTED":
      return {
        action: "Open pack",
        description: "A recovery plan is drafted and awaiting your approval.",
        href: `/projects/${projectId}/pack`,
      };
    case "APPROVED":
      return {
        action: "Open pack",
        description: "The recovery pack is approved and ready to print.",
        href: `/projects/${projectId}/pack`,
      };
    case "DRAFT":
    case "INTAKE_READY":
      return {
        action: "Add evidence",
        description:
          "Add site images showing context, condition, labels, and a known scale.",
        href: `/projects/${projectId}/capture`,
      };
  }
}
