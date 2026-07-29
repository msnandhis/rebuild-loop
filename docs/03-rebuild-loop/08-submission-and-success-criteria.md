# 14. Submission Copy Draft

## Agent name

**ReBuild Loop — Pre-Demolition Circularity Agent**

## One-line description

> Before demolition turns reusable building components into mixed rubble, ReBuild Loop turns a phone walkthrough into a human-reviewed recovery plan and matched reuse opportunities.

## Problem and solution description

> Building materials often lose their identity and value the moment mechanical demolition begins. Indian project teams may have incomplete drawings, fragmented spreadsheets and too little time to identify reuse demand before removal. ReBuild Loop uses Gemini to turn phone walkthroughs and optional BOQs into an evidence-linked, confidence-scored candidate inventory. It asks for missing measurements or close-ups, requires human confirmation, separates reusable components from EPR-relevant mineral debris, and uses transparent deterministic rules to recommend recovery pathways and demonstration buyer/recycler matches. A named reviewer approves the final recovery pack. ReBuild Loop is decision support, not a structural, hazardous-material or compliance certification system.

## How is it different?

> Existing international platforms already offer audits, passports and marketplaces. ReBuild Loop is designed for low-data Indian renovation and demolition workflows. Its core innovation is an evidence-seeking agent that exposes uncertainty and maintains two distinct material ledgers: high-value reusable/resalable components and EPR-relevant mineral debris. It does not create another empty marketplace; it prepares verified, buyer-ready lots and routes them into existing reuse, scrap, recycler and municipal channels. Matching and impact calculations are deterministic and blocked until a human confirms the inventory.

## Major roadblocks

> Visual media cannot establish exact quantities, structural fitness or the absence of hazardous material. We addressed this by preserving evidence provenance, expressing uncertain ranges, asking targeted clarification questions, blocking unsafe pathways, and recording human approval. A second challenge is the absence of live buyer and municipal APIs, so the prototype uses a clearly labelled demonstration demand dataset and makes no claim of live commercial or government integration.

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
- The agent asks at least one useful targeted clarification.
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
