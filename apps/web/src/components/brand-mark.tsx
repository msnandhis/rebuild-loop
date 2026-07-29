export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        aria-hidden="true"
        className="size-8 shrink-0"
        fill="none"
        viewBox="0 0 32 32"
      >
        <path
          d="M6 9.5 16 4l10 5.5v13L16 28 6 22.5v-13Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="m6.5 10 9.5 5.5 9.5-5.5M16 15.5V28"
          stroke="var(--brand)"
          strokeWidth="2.5"
        />
      </svg>
      <span
        className={`font-heading text-lg font-bold tracking-[-0.03em] ${
          inverse ? "text-white" : "text-ink"
        }`}
      >
        ReBuild Loop
      </span>
    </span>
  );
}
