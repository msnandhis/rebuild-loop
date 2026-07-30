import { notFound } from "next/navigation";

import { AnalysisRunStatus } from "../../../../../../components/analysis/analysis-run-status";
import { LimitationNote } from "../../../../../../components/workspace/limitation-note";
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
    <div className="max-w-[860px] space-y-4">
      <AnalysisRunStatus analysisId={analysisId} projectId={project.id} />

      <LimitationNote>
        The run is durable, so you can leave this screen and return to the same
        record. Structured model output is validated before anything is
        published, and candidates appear for review only after the complete
        result passes its checks.
      </LimitationNote>
    </div>
  );
}
