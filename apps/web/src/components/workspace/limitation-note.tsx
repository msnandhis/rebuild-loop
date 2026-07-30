import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Collapsed scope and limitation copy.
 *
 * The design system requires the product to stay explicit about uncertainty and
 * to never imply certification, but that text is reference material rather than
 * something the operator re-reads on every visit. It stays one keystroke away
 * instead of occupying the top of the screen.
 */
export function LimitationNote({
  children,
  summary = "Scope and limitations",
}: {
  children: ReactNode;
  summary?: string;
}) {
  return (
    <details className="group border border-rule bg-paper px-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-ink-muted transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus">
        <ChevronRight
          aria-hidden="true"
          className="shrink-0 transition-transform duration-150 group-open:rotate-90"
          size={14}
          strokeWidth={1.75}
        />
        {summary}
      </summary>
      <div className="max-w-[70ch] pb-4 pl-6 text-[13px] leading-6 text-ink-muted">
        {children}
      </div>
    </details>
  );
}
