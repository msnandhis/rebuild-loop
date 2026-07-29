# 4. Product Definition

## Five jobs the MVP must perform exceptionally well

### 1. Acquire site evidence

Accept up to 12 images, one short walkthrough video, spoken or typed notes, project location and an optional PDF/XLSX/CSV BOQ.

### 2. Create a confidence-scored candidate inventory

For each candidate, show material, likely subtype, visible condition, uncertain quantity range, evidence reference, unknowns, confidence and any specialist-review flag.

### 3. Ask for targeted clarification

The agent should request specific evidence, for example:

- “Measure the width and height of the six door leaves.”
- “Capture a close-up of the fire-rating label.”
- “Confirm whether the timber has visible moisture damage.”
- “Upload the relevant BOQ page for the ceiling grid.”

This is the most important agentic behavior. It converts a one-shot vision demo into an evidence-seeking decision system.

### 4. Create deterministic pathways and matches

After human confirmation, separate materials into same-site reuse, direct resale/reuse, commodity scrap, EPR-relevant recycling, specialist review and residual disposal. Rank matches against a clearly labelled demonstration demand dataset.

### 5. Produce a human-approved recovery pack

Generate:

- Preliminary inventory.
- Evidence-linked material lot cards/passports.
- Dual-lane material summary.
- Selective deconstruction sequence.
- Buyer/recycler shortlist.
- Uncertainty and specialist-review register.
- Transparent potential-diversion/value estimates.
- Draft C&D waste-management inputs.
- Named human approval and audit history.

## The agent loop

```text
Observe site media and BOQ
        ↓
Propose candidate inventory with evidence and uncertainty
        ↓
Identify decision-blocking unknowns
        ↓
Ask the human for targeted measurements or close-ups
        ↓
Revise candidates from the new evidence
        ↓
Human confirms, edits, rejects or escalates each item
        ↓
Deterministic rules calculate pathways and transparent matches
        ↓
Human approves or rejects the plan
        ↓
Agent adapts when evidence or destination availability changes
```

## The unforgettable demo behavior

The agent initially marks a door as “probable direct reuse.” A close-up then reveals swelling and an unreadable fire-rating label. It withdraws the recommendation, requests professional verification, updates the inventory and reduces the potential-diversion estimate.

That single change demonstrates observation, uncertainty, evidence-seeking, safe adaptation and traceability.

## 5. MVP Scope and Explicit Cuts

## Build for the hackathon

- One organization and one seeded reviewer account.
- Project creation and site metadata.
- Image, short-video and optional BOQ intake.
- One Gemini structured extraction workflow.
- Evidence-linked candidate inventory.
- Human confirm, edit, reject and specialist-review actions.
- No more than eight material families: concrete, brick, steel, timber, glass, aluminium, fixtures and other.
- Separate reuse/resale and EPR-relevant rubble ledgers.
- Versioned deterministic recovery rules.
- 20–40 synthetic buyer/recycler demand records.
- Transparent matching with score explanations.
- Versioned impact factors and “potential,” not verified, outcomes.
- Recovery plan, preliminary material passport and draft waste-plan export.
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
2. **Guided intake** — capture checklist, upload media/BOQ and consent/data-retention notice.
3. **Analysis progress** — clear asynchronous job state and recoverable failure handling.
4. **Evidence review queue** — candidate, image/frame evidence, observation, unknowns and confidence.
5. **Clarification inbox** — targeted measurements or close-ups that unblock decisions.
6. **Confirmed inventory** — dual-lane material ledger with complete provenance.
7. **Pathways** — rule explanation, alternatives, preparation requirements and overrides.
8. **Matches** — transparent compatibility, quantity, distance, timing and condition scores.
9. **Recovery plan** — removal sequence, dependencies, unresolved risks and human approval.
10. **Evidence pack** — export preview and honest methodology/limitation notes.

## Evidence-first review card

```text
Candidate: Timber fire door
Model confidence: 0.74 — highlighted review
Evidence: Video 1, 00:19–00:24; Photo 4
Visible observation: six similar leaves; surface wear
Quantity estimate: 5–7 count, not confirmed
Unknowns: dimensions, fire label, moisture damage
Specialist review: required if reused as a rated assembly

[Confirm] [Edit] [Reject] [Request evidence] [Needs specialist]
```

Never hide uncertainty behind a polished sustainability score.
