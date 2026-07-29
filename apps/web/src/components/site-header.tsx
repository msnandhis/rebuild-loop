import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link
          aria-label="ReBuild Loop home"
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          href="/"
        >
          <BrandMark />
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-5">
          <a
            className="hidden min-h-11 items-center px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:inline-flex"
            href="/method"
          >
            Method & limitations
          </a>
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-action bg-action px-4 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            href="/projects/demo/review"
          >
            Open demo
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
          </a>
        </nav>
      </div>
    </header>
  );
}
