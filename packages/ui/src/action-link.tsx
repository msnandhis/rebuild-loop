import type { AnchorHTMLAttributes, ReactNode } from "react";

type ActionLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary";
};

export function ActionLink({
  children,
  className = "",
  tone = "primary",
  ...props
}: ActionLinkProps) {
  const toneClass =
    tone === "primary"
      ? "border-action bg-action text-white hover:border-ink hover:bg-ink"
      : "border-action bg-paper text-action hover:bg-brand-wash";

  return (
    <a
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
