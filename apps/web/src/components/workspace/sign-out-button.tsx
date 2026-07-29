"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "../../lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      aria-label={pending ? "Signing out" : "Sign out"}
      className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-paper-subtle hover:text-action disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace("/sign-in");
        router.refresh();
      }}
      type="button"
    >
      <LogOut aria-hidden="true" size={16} strokeWidth={1.75} />
      <span className="hidden sm:inline">
        {pending ? "Signing out…" : "Sign out"}
      </span>
    </button>
  );
}
