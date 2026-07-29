import Link from "next/link";

import type { AuthSession } from "../../lib/auth";
import { BrandMark } from "../brand-mark";
import { SignOutButton } from "./sign-out-button";

export function WorkspaceHeader({ session }: { session: AuthSession }) {
  const initials = session.user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/98">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-5 md:px-8">
        <div className="flex items-center gap-7">
          <Link
            aria-label="ReBuild Loop projects"
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            href="/projects"
          >
            <BrandMark />
          </Link>
          <nav
            aria-label="Workspace"
            className="hidden items-center gap-1 md:flex"
          >
            <Link
              className="inline-flex min-h-11 items-center border-b-2 border-action px-3 text-sm font-semibold text-ink"
              href="/projects"
            >
              Projects
            </Link>
            <Link
              className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-semibold text-ink-muted transition-colors hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              href="/method"
            >
              Method & limitations
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-ink">
              {session.user.name}
            </p>
            <p className="max-w-52 truncate text-xs text-ink-muted">
              {session.user.email}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
          >
            {initials || "RL"}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
