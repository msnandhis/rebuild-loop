import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileImage,
  Ruler,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusTag } from "@rebuild/ui";

import { findOwnedProject } from "../../../../../lib/projects";
import { requireSession } from "../../../../../lib/session";

const captureItems = [
  {
    icon: Camera,
    title: "Overall context",
    detail: "Show the room, elevation, or zone before moving closer.",
  },
  {
    icon: FileImage,
    title: "Material and condition",
    detail: "Capture surfaces, edges, damage, corrosion, or contamination.",
  },
  {
    icon: Tag,
    title: "Labels and markings",
    detail:
      "Photograph fire labels, section marks, stamps, and product plates.",
  },
  {
    icon: Ruler,
    title: "Known scale",
    detail: "Include a measured dimension or a reliable scale reference.",
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
    <div className="mx-auto max-w-[1080px] px-5 py-8 md:px-8 md:py-12">
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
          <StatusTag tone="attention">No evidence added</StatusTag>
        </div>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-[-0.035em] md:text-4xl">
          Prepare useful site evidence.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
          Start with a small, deliberate set of images. Each file will become
          part of the project evidence record before Gemini can inspect it.
        </p>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_320px]">
        <section className="border border-rule bg-paper">
          <div className="border-b border-rule px-5 py-4 md:px-6">
            <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-ink-muted uppercase">
              Capture manifest / Initial survey
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold">
              Four views that make a decision possible
            </h2>
          </div>
          <ol className="divide-y divide-rule">
            {captureItems.map(({ detail, icon: Icon, title }, index) => (
              <li
                className="grid grid-cols-[44px_1fr] gap-4 px-5 py-5 md:px-6"
                key={title}
              >
                <span className="flex size-11 items-center justify-center rounded-md border border-rule bg-paper-subtle text-ink-muted">
                  <Icon aria-hidden="true" size={19} strokeWidth={1.75} />
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-action">
                      0{index + 1}
                    </span>
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-5">
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
                  Evidence limits
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
                  <li>JPEG, PNG, or WebP</li>
                  <li>Up to 10 MB per image</li>
                  <li>Up to six images per analysis</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="border-l-4 border-attention bg-attention-wash p-5">
            <p className="font-semibold text-attention">
              Private upload storage is the next delivery slice.
            </p>
            <p className="mt-2 text-sm leading-6 text-ink">
              The project and capture manifest are saved. Upload remains
              disabled until the private object-store boundary and verification
              checks are deployed; no file will be accepted without them.
            </p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-action underline decoration-action/35 underline-offset-4 hover:decoration-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              href="/projects/demo/review"
            >
              Review prepared demo evidence
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
            </Link>
          </section>

          <div className="flex min-h-12 items-center gap-3 border border-rule bg-paper px-4 text-sm text-ink-muted">
            <CheckCircle2
              aria-hidden="true"
              className="text-verified"
              size={18}
              strokeWidth={1.75}
            />
            Site brief saved and owned by you
          </div>
        </aside>
      </div>
    </div>
  );
}
