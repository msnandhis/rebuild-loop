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
        <nav aria-label="Primary" className="flex items-center gap-2">
          <div className="hidden items-center md:flex">
            {(
              [
                ["How it works", "/#how-it-works"],
                ["Materials list", "/#materials"],
                ["Sample review", "/#sample-review"],
              ] as const
            ).map(([label, href]) => (
              <Link
                className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-medium text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </div>
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-action bg-action px-4 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            href={session ? "/projects" : "/sign-in"}
          >
            {session ? "Open projects" : "Get started"}
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
