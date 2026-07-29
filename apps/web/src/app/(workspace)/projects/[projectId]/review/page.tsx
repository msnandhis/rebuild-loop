import { ArrowLeft, ArrowRight, FileSearch } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { listCandidates } from "../../../../../lib/candidates";
import { findOwnedProject } from "../../../../../lib/projects";
import { requireSession } from "../../../../../lib/session";

export default async function ReviewQueuePage({
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

  const candidates = await listCandidates(projectId, session.user.id);

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-12">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        href={`/projects/${project.id}`}
      >
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
        Project overview
      </Link>

      <header className="mt-5 border-b border-rule pb-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-ink-muted">
            {project.code} / REVIEW
          </span>
          <StatusTag tone={candidates.length ? "attention" : "neutral"}>
            {candidates.length
              ? `${candidates.length} available to inspect`
              : "No proposals"}
          </StatusTag>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em] md:text-4xl">
          Inspect model proposals.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
          Each row is preliminary. Open a proposal to inspect the source
          evidence and unresolved questions before any human decision.
        </p>
      </header>

      {candidates.length ? (
        <section className="mt-7 border border-rule bg-paper">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-rule px-5 py-3 font-mono text-[11px] tracking-[0.08em] text-ink-muted uppercase md:grid-cols-[120px_minmax(0,1fr)_210px_auto]">
            <span className="hidden md:block">Candidate</span>
            <span>Proposal</span>
            <span className="hidden md:block">Uncertainty</span>
            <span>Action</span>
          </div>
          <ol className="divide-y divide-rule">
            {candidates.map((candidate) => {
              const unknowns = toStringArray(candidate.unknowns);
              return (
                <li
                  className="grid gap-3 px-5 py-5 md:grid-cols-[120px_minmax(0,1fr)_210px_auto] md:items-center"
                  key={candidate.candidate_thread_id}
                >
                  <span className="font-mono text-xs text-ink-muted">
                    MAT-
                    {candidate.candidate_thread_id.slice(0, 8).toUpperCase()}
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-bold">
                      {candidate.subtype ?? candidate.material_family}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {candidate.observation_summary}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-ink-muted">
                    {unknowns[0] ?? "No unknown was recorded."}
                  </p>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-action px-4 text-sm font-semibold text-action transition-colors hover:bg-brand-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    href={`/projects/${projectId}/review/${candidate.candidate_thread_id}`}
                  >
                    Inspect proposal
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : (
        <section className="mt-7 border border-rule bg-paper px-6 py-12 text-center">
          <FileSearch
            aria-hidden="true"
            className="mx-auto text-ink-muted"
            size={32}
            strokeWidth={1.5}
          />
          <h2 className="mt-4 font-heading text-xl font-bold">
            No model proposals yet.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
            Add verified evidence and complete an analysis run before review.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-action bg-action px-5 text-sm font-semibold text-white hover:bg-ink"
            href={`/projects/${projectId}/capture`}
          >
            Add evidence
          </Link>
        </section>
      )}
    </div>
  );
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
