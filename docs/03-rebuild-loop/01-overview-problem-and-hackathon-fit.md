# Selected Project — ReBuild Loop

## Pre-Demolition Circularity Agent

Research and architecture decision record, validated on **16 July 2026**.

This document retains the original product strategy. For the current
implementation boundary, verified research, and submission narrative, use
[Product Truth, Research, and Hackathon Story](09-product-truth-research-and-hackathon-story.md).

## Executive Verdict

**Build ReBuild Loop and submit it under Open Innovation.**

The strongest version is not a generic material marketplace and not an automated compliance tool. It is:

> **A human-supervised pre-demolition recovery agent. From verified site
> images, it creates evidence-linked material proposals, exposes unknowns,
> preserves clarification revisions, and produces a human-approved recovery
> plan before demolition begins.**

The memorable idea is simple:

> **The fate of a building's materials is decided before the excavator arrives.**

Most waste software begins after material has become mixed debris. ReBuild Loop intervenes while doors, windows, fixtures, timber, steel, brick and concrete still have identity, evidence and potential value.

### Final scorecard

| Dimension                 |     Rating | Reason                                                                                                    |
| ------------------------- | ---------: | --------------------------------------------------------------------------------------------------------- |
| Problem urgency           |       9/10 | India's new C&D rules took effect on 1 April 2026, while recovery remains fragmented                      |
| Hackathon differentiation |       9/10 | India-specific, low-data, confidence-aware dual-lane recovery is a sharper wedge than another marketplace |
| Demo quality              |      10/10 | Highly visual before/after workflow with an agent that asks, adapts and explains                          |
| Technical feasibility     |       9/10 | One Gemini model, deterministic rules and seeded demand are achievable before the deadline                |
| Social/community appeal   |       9/10 | The “before the excavator” story is understandable without domain knowledge                               |
| Commercial potential      |       8/10 | Clear users among developers, contractors, auditors and circularity consultants                           |
| Safety/credibility        |       9/10 | Human verification and explicit uncertainty avoid false certification claims                              |
| Overall winning potential | **9.1/10** | Strong if the team demonstrates the agent loop rather than a static dashboard                             |

## 1. Hackathon Requirements and Product Fit

## Verified current requirements

| Requirement        | Current published position                                                    | ReBuild Loop response                                                             |
| ------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Deadline           | **1 August 2026, 11:59 PM IST**                                               | Submit and complete voting before the current published cutoff                    |
| Finale             | Top 100; **8 August 2026, 9:00 AM IST**, Bengaluru; venue undisclosed         | Keep the demo reproducible and deployable from the repository                     |
| Eligibility        | Developers, students, founders and researchers across India; all skill levels | Eligible based on the published wording                                           |
| AI stack           | Any combination of the listed Google technologies                             | Use **Gemini Models** only; do not claim services not implemented                 |
| Evaluation         | AI-agent/team evaluation 50%                                                  | Show a real observe-decide-act-review-adapt loop and publish evaluation evidence  |
| Community          | Public votes 25%                                                              | Create an immediately understandable Agent Card and short visual demo             |
| Feedback           | Structured feedback 25%                                                       | Submit early, act on feedback and document improvements                           |
| Submission updates | Allowed                                                                       | Treat the first submission as a measurable iteration, not the final freeze        |
| Working demo       | Required                                                                      | Public HTTPS deployment on the team's VPS through Coolify                         |
| Video demo         | Required                                                                      | Script a concise failure-to-recovery story                                        |
| GitHub repository  | Landing page expects it; form currently marks it optional                     | Include a reviewer-accessible repository with setup, architecture and limitations |

Required live-form content includes full name, LinkedIn URL, agent name, description, differentiation, major roadblocks, at least one Google technology, thumbnail, category, live-demo URL and video-demo URL. The live form has no separate prose problem-statement field, so the description and differentiation fields must carry the complete problem, user and value story.

Primary sources: [programme page](https://www.aihouze.xyz/google-hackathon), [submission form](https://app.hidevs.xyz/nominate/google), [submission configuration](https://dev.api.hidevs.xyz/api/nominations/config?program=google_builder_series_2026), and [finale listing](https://luma.com/ai-zxaj).

## Correct stream

Select **Open Innovation (`open_track`)**.

Do not enter the Waste Collection & Bin Overflow stream. Its published problem is specifically about fixed municipal pickup schedules, overflowing bins, missed-collection reporting, real-time routes and alerts. ReBuild Loop addresses an upstream construction-and-demolition material-recovery problem, not household or municipal-bin collection.

Position it as:

> **Urban circularity and pre-demolition resource recovery for Indian projects.**

## Google technology declaration

Select only **Gemini Models** in the submission form unless the implementation later adds another Google service for a real product need.

List the rest under other technology:

> Next.js 16.2, TypeScript, PostgreSQL, Docker Compose, Coolify and S3-compatible object storage.

VPS hosting is acceptable. Do not select or claim Cloud Run, Vertex AI, Agent Engine, BigQuery, ADK, MCP or A2A merely because they appear in the hackathon list.

## Rules that remain undocumented

The public material does not currently establish team-size limits, IP ownership, travel support, pre-existing-code rules, open-source requirements, vote controls, tie-breaking, or the exact formula for structured feedback. Avoid making assumptions about these points in public copy.

## 2. Problem Definition

## The real problem

Once mechanical demolition starts, recoverable components rapidly become contaminated, broken or mixed. The current decision process is commonly fragmented across site photos, drawings, spreadsheets, a demolition contractor's judgement, informal scrap relationships and separate recycler calls.

This creates five failures:

1. Potentially reusable components are priced as scrap or destroyed.
2. Material information reaches buyers too late for demand to align with removal.
3. Existing buildings often lack reliable BIM or as-built records.
4. Developers and auditors spend time collecting and reconciling evidence instead of making decisions.
5. Mineral debris and reusable components are treated as one undifferentiated waste stream.

## The important regulatory distinction

India's Environment (Construction and Demolition) Waste Management Rules, 2025 took effect on **1 April 2026** and cover construction, demolition, remodelling, renovation and repair.

For the product story, maintain two distinct ledgers:

| Lane                          | Examples                                                       | Product treatment                                                                                      |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Reusable/resalable components | Iron, wood, plastic, metal, glass, doors, windows and fixtures | Preserve identity and value; recommend same-site reuse, direct reuse or existing resale/scrap channels |
| EPR-relevant rubble fraction  | Concrete, brick, plaster, stone, rubble, tiles and ceramics    | Quantify separately and recommend authorized processing/recycling pathways                             |

The rules define “producer” obligations for projects with built-up area of at least 20,000 square metres and require waste-management planning and portal processes. ReBuild Loop may help prepare **draft inputs and evidence**, but it is not the official portal, a registered recycler, an EPR-certificate issuer, a regulator or a compliance authority.

Primary source: [CPCB — Environment (Construction and Demolition) Waste Management Rules, 2025](https://cpcb.nic.in/uploads/hwmd/C%26D_rules_2025.pdf).

## Target user and starting segment

### Primary user

A project manager, circularity consultant, quantity surveyor or demolition-planning lead who must decide what can be recovered before demolition or renovation.

### Economic buyer

A developer, asset owner, demolition contractor or ESG/sustainability team that wants earlier recovery decisions, clearer evidence and lower material loss.

### Best initial site type

Start with a controlled **commercial interior strip-out, school renovation or office-floor refurbishment**. These sites contain visually distinct, countable components and support an honest demonstration without pretending to assess the structural fitness of an entire high-rise.

### Core job to be done

> **Turn a 15-minute site walkthrough into a human-verified recovery plan before demolition begins.**
