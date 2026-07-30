# 4. Product Definition

## Five jobs the current product must perform exceptionally well

### 1. Acquire site evidence

Accept up to six JPEG, PNG, or WebP site images and store them as verified,
private evidence.

### 2. Create a confidence-scored candidate inventory

For each candidate, show material, likely subtype, visible condition, uncertain quantity range, evidence reference, unknowns, confidence and any specialist-review flag.

### 3. Support targeted clarification

Gemini identifies unknowns. The reviewer turns a consequential unknown into a
specific evidence request, for example:

- “Measure the width and height of the six door leaves.”
- “Capture a close-up of the fire-rating label.”
- “Confirm whether the timber has visible moisture damage.”

The submitted close-up starts a linked Gemini re-analysis and produces an
immutable candidate revision.

### 4. Create deterministic pathways

After human confirmation, separate materials into same-site reuse, direct
reuse, recycling, specialist review, and residual disposal. Keep route rules and
their gate results outside Gemini.

### 5. Produce a human-approved recovery pack

Generate:

- Preliminary inventory.
- Evidence-linked inventory revisions.
- Dual-lane material summary.
- Deterministic route sheets.
- Uncertainty and specialist-review register.
- Named human approval and audit history.
- Printable recovery plan.

## The agent loop

```text
Observe verified site images
        ↓
Propose candidate inventory with evidence and uncertainty
        ↓
Identify decision-blocking unknowns
        ↓
Reviewer authors a targeted evidence request
        ↓
Gemini creates a linked revision from the new evidence
        ↓
Human confirms, edits, rejects or escalates each item
        ↓
Deterministic rules calculate pathways and safety gates
        ↓
Human approves or rejects the plan
```

## The unforgettable demo behavior

Gemini initially records a door as a possible salvage candidate while exposing an
unknown fire rating. The reviewer requests a close-up. The new revision shows
swelling while the label remains unreadable, so the reviewer chooses specialist
review and deterministic gates block direct reuse.

That single change demonstrates observation, uncertainty, evidence-seeking, safe adaptation and traceability.

## 5. MVP Scope and Explicit Cuts

## Build for the hackathon

- One organization and one seeded reviewer account.
- Project creation and site metadata.
- Verified still-image intake.
- One Gemini structured extraction workflow.
- Evidence-linked candidate inventory.
- Human confirm, edit, reject and specialist-review actions.
- No more than eight material families: concrete, brick, steel, timber, glass, aluminium, fixtures and other.
- Separate reuse/resale and EPR-relevant rubble ledgers.
- Versioned deterministic recovery rules.
- Deterministic route gates.
- Versioned recovery plan and printable HTML pack.
- Named approval, immutable AI output and audit events.
- One polished seeded project and one alternate scenario.

## Do not build before submission

- Live marketplace transactions, payment or escrow.
- Municipal or CPCB integration without a real supported API.
- Nationwide partner onboarding.
- BIM authoring or full CAD takeoff.
- Structural, fire, contamination or hazardous-material certification.
- Custom computer-vision model training.
- Blockchain, IoT sensors or QR passports.
- General-purpose chat.
- Multi-agent orchestration for presentation value.
- Native mobile application or offline synchronization.
- BigQuery, Vertex AI or Cloud Run without an actual requirement.
- Exact carbon, value or quantity claims from images.

## 6. User Experience

## Core screens

1. **Project setup** — site, renovation/demolition date, project type and optional scale.
2. **Guided intake** — capture checklist, still-image upload and evidence verification.
3. **Analysis progress** — clear asynchronous job state and recoverable failure handling.
4. **Evidence review queue** — candidate, image/frame evidence, observation, unknowns and confidence.
5. **Clarification inbox** — targeted measurements or close-ups that unblock decisions.
6. **Confirmed inventory** — dual-lane material ledger with complete provenance.
7. **Pathways** — rule explanation, alternatives, preparation requirements and overrides.
8. **Recovery plan** — route sequence, unresolved risks and human approval.
9. **Evidence pack** — printable preview and honest methodology/limitation notes.

## Evidence-first review card

```text
Candidate: Timber fire door
Model confidence: 0.74 — highlighted review
Evidence: Photo 4
Visible observation: six similar leaves; surface wear
Quantity estimate: 5–7 count, not confirmed
Unknowns: dimensions, fire label, moisture damage
Specialist review: required if reused as a rated assembly

[Confirm] [Edit] [Reject] [Request evidence] [Needs specialist]
```

Never hide uncertainty behind a polished sustainability score.
