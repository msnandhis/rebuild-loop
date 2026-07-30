# 14. Submission Copy Draft

## Agent name

**ReBuild Loop — Pre-Demolition Circularity Agent**

## One-line description

> ReBuild Loop turns verified site images into a human-reviewed material ledger
> and recovery plan before demolition turns useful components into mixed
> debris.

## Problem and solution description

> Recoverable building components are often documented too late, after
> destructive removal has reduced the available evidence and recovery options.
> ReBuild Loop uses Gemini to turn verified site images into preliminary
> observations linked to the source evidence and exposes what remains unknown.
> A reviewer accepts, corrects, rejects, requests a close-up, or escalates each
> proposal. New evidence creates a linked revision rather than hiding the
> earlier result. Deterministic rules then block unsafe direct-reuse routes and
> produce a versioned plan with named approval and an audit trail. ReBuild Loop
> is decision support, not a certification, compliance portal, or marketplace.

## How is it different?

> Existing international platforms already offer audits, passports, and
> marketplaces. ReBuild Loop focuses on the first-mile decision before
> demolition: incomplete site evidence, unresolved risks, and accountable
> material decisions. It preserves the evidence behind every proposal, supports
> a clarification and revision loop, keeps safety rules outside the model, and
> requires a named human decision before a recovery plan is approved.

## Major roadblocks

> Site images cannot prove exact quantity, structural fitness, fire performance,
> or the absence of hazardous material. The application therefore presents
> preliminary ranges and unknowns, preserves source evidence, requires human
> decisions, and blocks direct reuse when a specialist or safety gate remains
> unresolved. The current prototype has no live buyer or government integration,
> so it makes no transaction or compliance claim.

## Category

**Open Innovation**

## Google technology

**Gemini Models**

## Other stack

**Next.js 16.2, TypeScript, PostgreSQL, Docker Compose, Coolify, S3-compatible object storage**

## 15. Success Criteria and Go/No-Go Gates

## Product success for the hackathon

- A new user understands the problem in under 20 seconds.
- One project completes the full intake-to-approved-plan path.
- A model-identified unknown produces at least one useful human-authored
  clarification request.
- New evidence visibly changes one recommendation.
- No unconfirmed item reaches matching.
- No specialist-flagged item is recommended for direct reuse.
- Every final plan line traces to evidence, a rule version and a human decision.
- The public demo recovers cleanly from a failed AI job.
- All seeded demand and estimated outcomes are labelled honestly.

## No-go conditions

Do not submit a build whose main experience is:

- A chatbot answering circular-economy questions.
- A photo classifier with a static dashboard.
- A marketplace with fake listings but no evidence workflow.
- A report generator with no human decision or adaptation.
- A compliance claim unsupported by official integration.

## Final Product Principle

Build one narrow system with one unforgettable claim:
