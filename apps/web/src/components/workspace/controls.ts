/**
 * Operational control styles for application screens.
 *
 * The design system reserves full radius for marketing buttons and compact
 * status tags; in-product controls use the 8px radius. Only the primary action
 * carries brand magenta so a screen never presents several equally loud
 * controls.
 */

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export const primaryControl = `${base} border-action bg-action text-white hover:border-ink hover:bg-ink`;

export const secondaryControl = `${base} border-rule-strong bg-paper text-ink hover:border-ink hover:bg-paper-subtle`;

export const disabledControl = `${base} cursor-not-allowed border-rule bg-paper-subtle text-ink-muted`;

/** Text-only action for tertiary navigation inside a panel header. */
export const quietControl =
  "inline-flex min-h-9 items-center gap-1.5 text-[13px] font-semibold text-ink-muted transition-colors duration-150 hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
