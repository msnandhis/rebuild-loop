import type { ReactNode } from "react";

/**
 * A work surface with an optional single-row header.
 *
 * The header replaces the eyebrow + large heading + paragraph stack that every
 * screen previously repeated: a short label, the state, and the action that
 * belongs to this surface all sit on one line.
 */
export function Panel({
  actions,
  children,
  meta,
  status,
  title,
  titleId,
}: {
  actions?: ReactNode | undefined;
  children: ReactNode;
  meta?: ReactNode | undefined;
  status?: ReactNode | undefined;
  title?: string | undefined;
  titleId?: string | undefined;
}) {
  const hasHeader = Boolean(title || status || meta || actions);

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className="border border-rule bg-paper"
    >
      {hasHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-rule px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {title ? (
              <h2 className="text-[15px] font-semibold" id={titleId}>
                {title}
              </h2>
            ) : null}
            {status}
            {meta ? (
              <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                {meta}
              </span>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
