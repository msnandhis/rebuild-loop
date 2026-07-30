import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "../../components/brand-mark";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main
      className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(360px,0.72fr)_minmax(480px,1fr)]"
      id="main-content"
    >
      <section className="hidden border-r border-rule bg-brand-black p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link
          aria-label="ReBuild Loop home"
          className="w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          href="/"
        >
          <BrandMark inverse />
        </Link>
        <div className="max-w-md">
          <h2 className="font-heading text-3xl leading-tight font-bold tracking-[-0.035em]">
            Evidence-led material recovery.
          </h2>
          <p className="mt-4 max-w-[38ch] text-sm leading-6 text-white/65">
            Capture site evidence, review proposals, and approve traceable
            recovery plans.
          </p>
        </div>
        <p className="text-xs text-white/45">Field workspace</p>
      </section>
      <section className="relative flex min-h-screen items-center justify-center bg-paper px-5 py-20 sm:px-8 lg:bg-canvas">
        <Link
          className="absolute top-5 right-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-rule-strong bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-paper-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:top-8 sm:right-8"
          href="/"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
          Back
        </Link>
        <div className="w-full max-w-[420px] bg-paper lg:border lg:border-rule lg:p-8">
          <Link
            aria-label="ReBuild Loop home"
            className="mb-9 block w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus lg:hidden"
            href="/"
          >
            <BrandMark />
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
