# 8. AI Contract, Rules and Safety

The evaluation section in this document is a plan, not measured model
performance. The current repository has 12 scenario definitions without
attached image fixtures or scored Gemini results. See
[Product Truth, Research, and Hackathon Story](09-product-truth-research-and-hackathon-story.md)
for the current evidence boundary.

## Structured extraction contract

Use Gemini structured outputs and validate again with Zod. Each candidate must include:

- Schema version.
- Material family and nullable subtype.
- Plain-language description.
- Visible condition and confidence.
- Quantity range, unit, basis and confidence.
- At least one media/page evidence reference.
- Unknowns and possible contamination flags.
- Specialist-review requirement.
- Nullable preliminary pathway suggestion.
- Overall confidence.

Structured output guarantees shape, not semantic correctness. The application must reject impossible ranges, unsupported units, missing evidence and unsafe model assertions. Source: [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

Store model name, prompt version, schema version, input hash, raw output, normalized output, token usage, latency and errors.

## Confidence policy

Confidence is a model signal, not a calibrated scientific probability.

| Score                         | UI treatment                                |
| ----------------------------- | ------------------------------------------- |
| 0.80 and above                | Normal mandatory review                     |
| 0.55–0.79                     | Highlighted review                          |
| Below 0.55                    | Low-confidence warning and evidence request |
| Any structural/hazard concern | Specialist-review block regardless of score |

## Deterministic pathway engine

Example rules:

```text
IF material = timber
AND human-confirmed condition IN {GOOD, FAIR}
AND contamination flag = false
THEN preferred pathway = DIRECT_REUSE

IF material = concrete
AND reusable component = false
AND hazard flag = false
THEN preferred pathway = AUTHORIZED_RECYCLING

IF hazard status = UNKNOWN
OR structural reuse is proposed without verification
THEN pathway = SPECIALIST_REVIEW
```

Each decision stores the rule version, inputs, fired rule IDs, preferred and alternative pathway, explanation, preparation requirements and any human override with reason.

## Transparent matching

Apply hard filters first:

- Inventory is human-confirmed.
- Material family/subtype is compatible.
- Units are compatible.
- Buyer accepts the confirmed condition.
- Quantity threshold is met.
- Availability overlaps need date.
- No unresolved specialist/hazard block exists.

Then calculate:

```text
Compatibility      35%
Quantity coverage  20%
Distance           20%
Timing overlap     15%
Condition fit      10%
```

Use Haversine distance for the MVP. Show every score component. Mark all seeded records **Demonstration demand — not a live commercial offer**.

## Impact methodology

Use confirmed quantities and versioned, cited factors only. Separate:

- Potential reuse/diversion.
- Planned reuse/diversion.
- Verified completed outcome.

Do not merge them. Never let Gemini generate impact factors. Do not label estimates “carbon saved” or “waste diverted” before the underlying outcome is verified.

## Claims to avoid

Do not say:

- India's first material-passport platform.
- The world's first AI pre-demolition audit.
- Fully automated regulatory compliance.
- CPCB-approved, government-certified or an EPR-certificate generator.
- AI-certified structural safety or absence of asbestos/lead/hazards.
- Exact quantity, value or carbon saving from video.
- Guaranteed buyer, sale, diversion or environmental outcome.
- Live government/marketplace integration when using seeded data.
- Official material passport or audit.
- Replacement for an engineer, auditor or quantity surveyor.
- 100% traceability in a prototype.

Prefer:

- Preliminary inventory.
- Confidence-scored estimate.
- Decision support.
- Human-approved disposition plan.
- Professional verification required.
- Potential diversion/value.
- Draft waste-management inputs.
- Export-ready evidence pack.
- Buyer/recycler recommendation.

## 9. Evaluation Plan

The project needs an evaluation story, not only a product demo.

## Small gold dataset

Create 30–50 labelled evidence cases across the eight material families. Include:

- Clear and ambiguous images.
- Repeated objects where counting is difficult.
- Poor lighting and occlusion.
- BOQ/image disagreements.
- Damaged components.
- Missing measurements.
- Unsafe or specialist-review cases.
- One adversarial prompt embedded in a document/image caption.

Have a knowledgeable human create expected material family, visible condition, evidence link, unknowns and correct review action.

## Metrics

| Layer          | Metric                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| Extraction     | Material-family precision/recall and structured-output validity            |
| Evidence       | Evidence-reference correctness                                             |
| Safety         | Specialist-review recall; unsafe automatic-confirm rate must be zero       |
| Uncertainty    | Rate of ambiguous cases correctly sent for clarification/review            |
| Human workflow | Candidate acceptance, edit and rejection rates                             |
| Matching       | Hard-filter violation rate must be zero; top-3 relevance judged by a human |
| Agent behavior | Clarification usefulness and plan adaptation success                       |
| Reliability    | Job completion, retry recovery, latency and cost per project               |
| Auditability   | Percentage of final plan items traceable to evidence and a named decision  |

## Required demo tests

1. Clear reusable fixture is detected and confirmed.
2. Ambiguous item triggers a targeted evidence request.
3. New evidence changes the pathway.
4. Unconfirmed inventory cannot be matched.
5. Specialist flag blocks a reuse match.
6. Buyer rejection produces an alternative destination.
7. Failed Gemini call retries without duplicating candidates.
8. Every plan item traces to evidence, rule version and human decision.

Publish the methodology, sample count and limitations. A small honest benchmark is more persuasive than an unsupported “95% accurate” claim.
