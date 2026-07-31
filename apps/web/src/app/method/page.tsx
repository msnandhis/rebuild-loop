import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";

import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export const metadata = {
  title: "Method and limits",
};

const principles = [
  {
    icon: CheckCircle2,
    title: "Evidence before assertion",
    body: "Every candidate points to a source reference. If the source is weak or absent, the workflow asks for more evidence instead of silently guessing.",
  },
  {
    icon: CircleDashed,
    title: "Uncertainty stays visible",
    body: "Confidence is expressed as a reason and required next action, not a decorative percentage that implies more certainty than exists.",
  },
  {
    icon: AlertTriangle,
    title: "Consequential decisions are gated",
    body: "Hazard, structural, contamination, quantity, and destination decisions remain subject to competent-person review.",
  },
];

export default function MethodPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-rule bg-paper">
          <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
            <p className="font-mono text-xs font-medium tracking-[0.16em] text-action uppercase">
              Method note / rev 0.1
            </p>
            <h1 className="mt-5 max-w-3xl font-heading text-4xl leading-tight font-bold tracking-[-0.04em] md:text-5xl">
              What ReBuild Loop can support, and what it cannot decide.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-muted">
              The product helps teams organise evidence and prepare recovery
              decisions. It does not certify materials, replace site
              professionals, or guarantee reuse demand.
            </p>
          </div>
        </section>
        <section className="bg-canvas">
          <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
            <div className="grid gap-px overflow-hidden border border-rule bg-rule md:grid-cols-3">
              {principles.map(({ body, icon: Icon, title }) => (
                <article className="bg-paper p-6 md:p-7" key={title}>
                  <Icon
                    aria-hidden="true"
                    className="text-action"
                    size={23}
                    strokeWidth={1.75}
                  />
                  <h2 className="mt-5 font-heading text-xl font-semibold">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    {body}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-[220px_1fr]">
              <h2 className="font-heading text-xl font-semibold">
                Current limitations
              </h2>
              <div className="page-rule border-t-2 border-ink">
                {[
                  "Model proposals may misidentify material, condition, connection, or quantity.",
                  "Visual evidence cannot establish hidden contamination, structural capacity, or legal compliance.",
                  "Demand matches in the demonstration are synthetic, not live offers or guaranteed transactions.",
                  "Potential impact is a transparent scenario estimate, not a verified environmental claim.",
                  "Approved outputs must retain source evidence, rule version, reviewer, date, and stated limitations.",
                ].map((item, index) => (
                  <div
                    className="grid grid-cols-[40px_1fr] border-b border-rule bg-paper/90 py-4"
                    key={item}
                  >
                    <span className="font-mono text-xs text-action">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="leading-6">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
