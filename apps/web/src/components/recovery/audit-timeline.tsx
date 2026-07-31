import { Bot, CircleUserRound, GitCommitHorizontal } from "lucide-react";

import type { AuditTimelineEvent } from "../../lib/recovery";

export function AuditTimeline({
  events,
  limit,
}: {
  events: AuditTimelineEvent[];
  limit?: number;
}) {
  const visible = typeof limit === "number" ? events.slice(0, limit) : events;

  if (!visible.length) {
    return (
      <div className="border border-rule bg-paper px-5 py-10 text-center">
        <GitCommitHorizontal
          aria-hidden="true"
          className="mx-auto text-ink-muted"
          size={30}
          strokeWidth={1.5}
        />
        <h2 className="mt-3 font-heading text-xl font-bold">
          No recorded events yet.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
          Evidence, model runs, decisions, pathway rules, and approvals will
          appear here without replacing earlier records.
        </p>
      </div>
    );
  }

  return (
    <ol className="border border-rule bg-paper">
      {visible.map((event, index) => {
        const isSystem = event.actorLabel === "ReBuild Loop";
        const Icon = isSystem ? Bot : CircleUserRound;
        return (
          <li
            className={`grid grid-cols-[32px_minmax(0,1fr)] gap-3 px-4 py-5 md:grid-cols-[42px_minmax(0,1fr)_180px] md:px-6 ${
              index ? "border-t border-rule" : ""
            }`}
            key={event.id}
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-rule bg-paper-subtle text-ink-muted">
              <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-semibold text-ink">
                {eventLabel(event.eventType)}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                {event.actorLabel} · {event.entityType}
              </p>
              <dl className="mt-3 grid gap-1 font-mono text-[11px] leading-5 text-ink-muted sm:grid-cols-2 md:hidden">
                <div>
                  <dt className="inline">Event </dt>
                  <dd className="inline">{event.eventType}</dd>
                </div>
                <div>
                  <dt className="inline">Time </dt>
                  <dd className="inline">{formatTimestamp(event.createdAt)}</dd>
                </div>
              </dl>
            </div>
            <div className="hidden text-right md:block">
              <time
                className="font-mono text-[11px] leading-5 text-ink-muted"
                dateTime={event.createdAt.toISOString()}
              >
                {formatTimestamp(event.createdAt)}
              </time>
              <p className="mt-1 font-mono text-[10px] text-ink-muted">
                {event.correlationId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    "analysis.completed": "Model proposals created",
    "analysis.created": "Analysis queued",
    "analysis.failed": "Analysis failed",
    "analysis.started": "Evidence analysis started",
    "clarification.created": "Clarification requested",
    "clarification.submitted": "Clarification evidence submitted",
    "inventory.confirmed": "Material lot confirmed",
    "pathways.calculated": "Recovery pathways calculated",
    "plan.approved": "Recovery plan approved",
    "plan.drafted": "Recovery plan prepared",
    "project.created": "Project record created",
    "review.accepted": "Observation accepted",
    "review.corrected": "Observation corrected",
    "review.rejected": "Proposal rejected",
    "review.specialist_requested": "Specialist review required",
  };
  return labels[eventType] ?? sentenceCase(eventType);
}

function sentenceCase(value: string) {
  const text = value.replace(/[._-]+/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}
