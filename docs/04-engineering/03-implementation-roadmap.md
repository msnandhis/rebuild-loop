# Implementation Roadmap

## Delivery principle

Build vertical slices that cross UI, contracts, domain, persistence, jobs, and deployment. Avoid completing every database table or every static page before proving the core workflow.

## Foundation slice — current

- Root pnpm/Turborepo workspace.
- Next.js web app, worker, and evaluation app boundaries.
- Projects, Evidence, Inventory, and Recovery package boundaries.
- Platform and shared package boundaries.
- Authored Field Ledger design system.
- Production-grade application shell and seeded evidence-review workbench.
- Health routes, environment contract, Docker and Coolify foundation.
- Lint, typecheck, tests, build, and CI baseline.

## Slice 1 — Project and evidence

```text
Create project
→ save site brief
→ generate capture manifest
→ request signed upload
→ verify upload completion
→ enqueue analysis
```

Definition of done: organization-scoped persistence, retry-safe uploads, audit events, and a browser test for the happy path.

## Slice 2 — Analysis and human review

```text
Consume analysis task
→ call pinned Gemini model
→ validate structured output
→ store immutable output/candidates
→ review evidence-linked observations
→ request clarification or confirm an item
```

Definition of done: no model output directly creates confirmed inventory; new evidence can supersede a prior proposal without erasing it.

## Slice 3 — Recovery decision

```text
Confirmed item
→ dual-lane classification
→ deterministic pathway gates
→ transparent demonstration-demand matching
→ human-approved route
```

Definition of done: specialist flags and unconfirmed facts block matching; every score component and override is traceable.

## Slice 4 — Recovery pack

```text
Approved routes
→ numbered deconstruction sequence
→ uncertainty register
→ draft waste-plan inputs
→ sign-off
→ revisioned export
```

Definition of done: every plan line traces to source evidence, model proposal, human decision, rule version, and named approval.

## Slice 5 — Evaluation and launch

- Label 30–50 evidence cases.
- Measure schema validity, material classification, evidence correctness, clarification usefulness, and specialist-review recall.
- Complete responsive, keyboard, reduced-motion, 200% zoom, low-bandwidth, and recovery tests.
- Deploy through Coolify, validate backup/restore, rehearse the three-minute demo, and submit early for feedback.

## First UX story

The first end-to-end demo uses a seeded office-renovation project:

1. The reviewer opens a proposed timber fire-door candidate.
2. Selecting a claim opens its exact image/timecode evidence.
3. Missing fire-label and moisture evidence blocks direct reuse.
4. The reviewer creates a precise field clarification task.
5. A close-up arrives and visibly supersedes the old proposal.
6. The item moves to Specialist Review with an explanation.
7. Potential impact and downstream routes update without decorative animation.
