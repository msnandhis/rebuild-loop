import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { AnalysisRunStatus } from "../../../../../../components/analysis/analysis-run-status";
import { findOwnedProject } from "../../../../../../lib/projects";
import { requireSession } from "../../../../../../lib/session";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ analysisId: string; projectId: string }>;
}) {
  const session = await requireSession();
  const { analysisId, projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[920px] px-5 py-8 md:px-8 md:py-12">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        href={`/projects/${project.id}/capture`}
      >
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
        Evidence capture
      </Link>

      <header className="mt-5 border-b border-rule pb-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-ink-muted">
            {project.code} / ANALYSIS
          </span>
          <StatusTag tone="evidence">Between steps 2 and 3</StatusTag>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em] md:text-4xl">
          Evidence analysis record.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
          ReBuild Loop keeps this run durable, validates structured model
          output, and publishes candidates only after the complete result passes
          its checks.
        </p>
      </header>

      <div className="mt-7">
        <AnalysisRunStatus analysisId={analysisId} projectId={project.id} />
      </div>
    </div>
  );
}
