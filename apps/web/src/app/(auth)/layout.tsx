import Link from "next/link";

import { BrandMark } from "../../components/brand-mark";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main
      className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.72fr)]"
      id="main-content"
    >
      <section className="hidden border-r border-rule bg-brand-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link
          aria-label="ReBuild Loop home"
          className="w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          href="/"
        >
          <BrandMark inverse />
        </Link>
        <div className="max-w-xl">
          <p className="font-mono text-xs font-medium tracking-[0.14em] text-brand uppercase">
            Controlled project record
          </p>
          <h2 className="mt-5 font-heading text-4xl leading-tight font-bold tracking-[-0.04em]">
            Evidence first. Human decided. Every revision traceable.
          </h2>
          <div className="mt-8 grid gap-4 border-t border-white/20 pt-6 text-sm leading-6 text-white/70">
            <p>Site evidence stays connected to each material observation.</p>
            <p>Unknowns remain visible until a person resolves them.</p>
            <p>No model proposal approves its own recovery route.</p>
          </div>
        </div>
        <p className="font-mono text-xs text-white/45">
          REBUILD LOOP / FIELD LEDGER 0.1
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-paper px-5 py-10 sm:px-8 lg:bg-canvas">
        <div className="w-full max-w-[430px] border-rule bg-paper lg:border lg:p-9">
          <Link
            aria-label="ReBuild Loop home"
            className="mb-10 block w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus lg:hidden"
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
