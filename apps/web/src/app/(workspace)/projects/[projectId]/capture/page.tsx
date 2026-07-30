import {
  ArrowLeft,
  Camera,
  FileImage,
  Ruler,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { CaptureManifest } from "../../../../../components/capture/capture-manifest";
import { findOwnedProject } from "../../../../../lib/projects";
import { requireSession } from "../../../../../lib/session";

const captureItems = [
  {
    detail: "Show the room, elevation, or zone before moving closer.",
    icon: Camera,
    title: "Overall context",
  },
  {
    detail: "Capture surfaces, edges, damage, corrosion, or contamination.",
    icon: FileImage,
    title: "Material and condition",
  },
  {
    detail:
      "Photograph fire labels, section marks, stamps, and product plates.",
    icon: Tag,
    title: "Labels and markings",
  },
  {
    detail: "Include a measured dimension or a reliable scale reference.",
    icon: Ruler,
    title: "Known scale",
  },
] as const;

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
            {project.code} / CAPTURE
          </span>
          <StatusTag tone="evidence">Step 2 of 6</StatusTag>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em] md:text-4xl">
          Add site evidence.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
          Start with a small, deliberate set of images. ReBuild Loop verifies
          every file before it becomes part of the project record.
        </p>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <CaptureManifest projectId={project.id} />

        <aside className="space-y-5">
          <details className="border border-rule bg-paper">
            <summary className="min-h-12 cursor-pointer px-5 py-4 font-heading text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus">
              What to capture
            </summary>
            <ol className="divide-y divide-rule border-t border-rule">
              {captureItems.map(({ detail, icon: Icon, title }, index) => (
                <li
                  className="grid grid-cols-[36px_1fr] gap-3 px-5 py-4"
                  key={title}
                >
                  <span className="flex size-9 items-center justify-center rounded-md border border-rule bg-paper-subtle text-ink-muted">
                    <Icon aria-hidden="true" size={17} strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      <span className="mr-2 font-mono text-[10px] text-action">
                        0{index + 1}
                      </span>
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">
                      {detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </details>

          <section className="border border-rule bg-paper p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-verified"
                size={20}
                strokeWidth={1.75}
              />
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  Private evidence record
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  Files use short-lived secure upload links. Each upload is
                  checked against its declared size and type before analysis.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
