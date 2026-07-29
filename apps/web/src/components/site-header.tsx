import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { getSession } from "../lib/session";
import { BrandMark } from "./brand-mark";

export async function SiteHeader() {
  const session = await getSession();

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
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-3">
          <Link
            className="hidden min-h-11 items-center px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:inline-flex"
            href="/method"
          >
            Method & limitations
          </Link>
          {!session && (
            <>
              <Link
                className="hidden min-h-11 items-center px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:inline-flex"
                href="/sign-in"
              >
                Sign in
              </Link>
              <Link
                className="hidden min-h-11 items-center px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:inline-flex"
                href="/sign-up"
              >
                Create account
              </Link>
            </>
          )}
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-action bg-action px-4 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            href={session ? "/projects" : "/projects/demo/review"}
          >
            {session ? "Open projects" : "Open demo"}
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
