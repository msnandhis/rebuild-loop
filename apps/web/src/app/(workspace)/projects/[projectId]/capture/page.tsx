import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { CaptureManifest } from "../../../../../components/capture/capture-manifest";
import { ClarificationTask } from "../../../../../components/review/clarification-task";
import { LimitationNote } from "../../../../../components/workspace/limitation-note";
import { Panel } from "../../../../../components/workspace/panel";
import { listOpenProjectClarificationTasks } from "../../../../../lib/clarifications";
import { findOwnedProject } from "../../../../../lib/projects";
import { requireSession } from "../../../../../lib/session";

export const metadata = {
  title: "Site evidence",
};

const CAPTURE_CHECKLIST = [
  "One wide site view",
  "Material and damage close-ups",
  "Labels or markings",
  "A measured scale reference",
];

export default async function CapturePage({
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
  const clarificationTasks = await listOpenProjectClarificationTasks(
    projectId,
    session.user.id,
  );

  return (
    <div className="max-w-[980px] space-y-4">
      {clarificationTasks.length > 0 && (
        <Panel
          status={<StatusTag tone="attention">Do these first</StatusTag>}
          title="Requested evidence"
          titleId="requested-evidence"
        >
          <div className="space-y-3 p-4">
            {clarificationTasks.map((task) => (
              <ClarificationTask
                instruction={task.instruction}
                key={task.id}
                projectId={projectId}
                rationale={task.rationale}
                requiredEvidence={task.required_evidence}
                status={task.status}
                taskId={task.id}
              />
            ))}
          </div>
        </Panel>
      )}

      <CaptureManifest projectId={project.id} />

      <LimitationNote summary="Photo guide">
        <ul className="grid gap-1 sm:grid-cols-2">
          {CAPTURE_CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LimitationNote>
    </div>
  );
}
