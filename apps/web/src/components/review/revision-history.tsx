import { ArrowRight, History } from "lucide-react";

interface Revision {
  condition: unknown;
  createdAt: string;
  disposition: string;
  materialFamily: string;
  observationSummary: string;
  overallConfidence: number;
  preliminaryPathway: string;
  quantity: unknown;
  revisionId: string;
  revisionNumber: number;
  riskFlags: unknown;
  specialistReviewRequired: boolean;
  subtype: string | null;
  unknowns: unknown;
}

export function RevisionHistory({ revisions }: { revisions: Revision[] }) {
  if (revisions.length < 2) {
    return (
      <section className="mt-7 border border-rule bg-paper px-5 py-5">
        <div className="flex items-start gap-3">
          <History
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-ink-muted"
            size={19}
            strokeWidth={1.75}
          />
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Revision history
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              This is the first immutable proposal. New clarification evidence
              will create a new revision without replacing this record.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const [current, previous] = revisions;
  if (!current || !previous) return null;
  const changes = compare(current, previous);

  return (
    <section className="mt-7 border border-rule bg-paper">
      <div className="border-b border-rule px-5 py-4">
        <p className="font-mono text-[10px] text-evidence uppercase">
          Immutable proposal record
        </p>
        <h2 className="mt-1 font-heading text-xl font-semibold">
          Revision comparison
        </h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          Revision {previous.revisionNumber} remains available and is marked
          superseded by revision {current.revisionNumber}.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_auto_1fr]">
        <RevisionColumn label="Superseded" revision={previous} />
        <div className="hidden items-center border-x border-rule px-3 text-ink-muted md:flex">
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} />
        </div>
        <RevisionColumn label="Current" revision={current} />
      </div>

      <div className="border-t border-rule px-5 py-4">
        <h3 className="text-sm font-semibold">What changed</h3>
        {changes.length ? (
          <ul className="mt-2 space-y-2 text-sm leading-6">
            {changes.map((change) => (
              <li className="border-l-2 border-evidence pl-3" key={change}>
                {change}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            The model retained the visible observation; the new revision
            preserves the clarification run and its evidence provenance.
          </p>
        )}
      </div>

      <details className="border-t border-rule">
        <summary className="min-h-11 cursor-pointer px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus">
          View all {revisions.length} revisions
        </summary>
        <ol className="divide-y divide-rule border-t border-rule">
          {revisions.map((revision, index) => (
            <li
              className="grid gap-1 px-5 py-3 sm:grid-cols-[100px_1fr_auto]"
              key={revision.revisionId}
            >
              <span className="font-mono text-xs">
                REV {revision.revisionNumber}
              </span>
              <span className="text-sm">{revision.observationSummary}</span>
              <span className="font-mono text-[10px] text-ink-muted uppercase">
                {index === 0 ? "Current" : "Superseded"}
              </span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function RevisionColumn({
  label,
  revision,
}: {
  label: string;
  revision: Revision;
}) {
  return (
    <div className="px-5 py-5">
      <p
        className={`font-mono text-[10px] uppercase ${
          label === "Current" ? "text-verified" : "text-ink-muted"
        }`}
      >
        {label} / Revision {revision.revisionNumber}
      </p>
      <p className="mt-3 text-sm leading-6">{revision.observationSummary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-rule pt-3 text-xs">
        <div>
          <dt className="text-ink-muted">Material</dt>
          <dd className="mt-1 font-semibold">
            {revision.subtype ?? humanize(revision.materialFamily)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Pathway</dt>
          <dd className="mt-1 font-semibold">
            {humanize(revision.preliminaryPathway)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function compare(current: Revision, previous: Revision) {
  const changes: string[] = [];
  if (current.observationSummary !== previous.observationSummary) {
    changes.push("The visible observation was revised.");
  }
  if (
    current.materialFamily !== previous.materialFamily ||
    current.subtype !== previous.subtype
  ) {
    changes.push(
      `Material changed from ${previous.subtype ?? humanize(previous.materialFamily)} to ${current.subtype ?? humanize(current.materialFamily)}.`,
    );
  }
  if (current.preliminaryPathway !== previous.preliminaryPathway) {
    changes.push(
      `Preliminary pathway changed from ${humanize(previous.preliminaryPathway)} to ${humanize(current.preliminaryPathway)}.`,
    );
  }
  if (JSON.stringify(current.unknowns) !== JSON.stringify(previous.unknowns)) {
    changes.push("The list of unresolved unknowns changed.");
  }
  if (current.specialistReviewRequired !== previous.specialistReviewRequired) {
    changes.push(
      current.specialistReviewRequired
        ? "The revised proposal now requires specialist review."
        : "The model no longer explicitly requests specialist review.",
    );
  }
  return changes;
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
