import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { AuditTimeline } from "../../../../../components/recovery/audit-timeline";
import { LimitationNote } from "../../../../../components/workspace/limitation-note";
import { Panel } from "../../../../../components/workspace/panel";
import { findOwnedProject } from "../../../../../lib/projects";
import { listProjectAuditEvents } from "../../../../../lib/recovery";
import { requireSession } from "../../../../../lib/session";

export default async function ProjectAuditPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await findOwnedProject(projectId, session.user.id);
  if (!project) notFound();

  const events = await listProjectAuditEvents(project.id, session.user.id);

  return (
    <div className="max-w-[980px] space-y-4">
      <Panel
        status={
          <StatusTag>
            {events.length} {events.length === 1 ? "event" : "events"}
          </StatusTag>
        }
        title="Audit trail"
        titleId="audit-trail"
      >
        <AuditTimeline events={events} />
      </Panel>

      <LimitationNote>
        This append-only timeline records source evidence, model activity, human
        decisions, deterministic rules, and plan approval. Prior events are
        retained rather than overwritten. It is a workflow record, not a
        professional certification.
      </LimitationNote>
    </div>
  );
}
