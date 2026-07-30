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
      <div className="mx-auto flex min-h-14 max-w-[1440px] items-center justify-between gap-4 px-5 md:px-8">
        <div className="flex items-center gap-6">
          <Link
            aria-label="ReBuild Loop projects"
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            href="/projects"
          >
            <BrandMark />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="hidden min-h-11 items-center px-2 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:inline-flex"
            href="/method"
          >
            Method
          </Link>
          <span
            aria-hidden="true"
            title={session.user.name}
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
