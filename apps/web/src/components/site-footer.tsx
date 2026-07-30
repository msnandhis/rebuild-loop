import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="bg-brand-black text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1fr_auto] md:px-8">
        <div>
          <BrandMark inverse />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            Decision support for pre-demolition material recovery. Every route
            remains subject to evidence and professional review.
          </p>
        </div>
        <div className="flex items-start gap-8 text-sm">
          <a className="hover:text-brand" href="/method">
            Method
          </a>
          <a className="hover:text-brand" href="/api/health/live">
            System status
          </a>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 py-5 text-xs text-white/55 md:px-8">
          <span>
            Built by{" "}
            <a
              className="font-semibold text-white transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
              href="https://msnandhis.com"
              rel="noreferrer"
              target="_blank"
            >
              Nandhis S
            </a>
          </span>
          <span>
            Built for{" "}
            <strong className="font-semibold text-white">
              AI Agent Builder
            </strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
