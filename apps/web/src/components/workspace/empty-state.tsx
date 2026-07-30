import type { ReactNode } from "react";

/**
 * A compact, left-aligned empty state.
 *
 * Deliberately not a centered icon-and-paragraph block: an empty surface is a
 * routine state, so it states the reason in one line and offers the action that
 * resolves it.
 */
export function EmptyState({
  action,
  children,
}: {
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-6">
      <p className="max-w-[62ch] text-sm leading-6 text-ink-muted">
        {children}
      </p>
      {action}
    </div>
  );
}
