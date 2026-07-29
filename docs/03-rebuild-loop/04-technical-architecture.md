# 7. Technical Architecture

## Architecture decision

Use a **modular monolith plus one background worker**:

```text
Next.js 16.2 App Router and Route Handlers
        +
PostgreSQL source of truth and PostgreSQL-backed jobs
        +
Private S3-compatible object storage
        +
Stable Gemini 3.5 Flash through @google/genai
        +
Deterministic TypeScript rules, matching and impact calculations
        +
Docker Compose deployed through Coolify
```

Next.js 16.2 is the current stable release; 16.3 is preview. Use App Router and `app/**/route.ts` Route Handlers rather than Express or a second API framework. Sources: [Next.js 16.2](https://nextjs.org/blog/next-16-2), [App Router](https://nextjs.org/docs/app), [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).

Use stable, pinned `gemini-3.5-flash`, not a floating `latest` alias or preview model. Source: [Gemini model catalogue](https://ai.google.dev/gemini-api/docs/models).

## Responsibility boundary

| Gemini may do                        | Deterministic code must do           | Human must do                                               |
| ------------------------------------ | ------------------------------------ | ----------------------------------------------------------- |
| Recognize possible material families | Validate schemas and allowed units   | Confirm/edit/reject quantities                              |
| Extract BOQ candidate rows           | Apply dual-lane classification rules | Assess suitability where professional judgement is required |
| Describe visible condition           | Rank demand matches                  | Approve pathways and recovery plan                          |
| Cite media/frame evidence            | Calculate distances and impact       | Accept legal, safety and commercial responsibility          |
| Suggest uncertain quantity ranges    | Record versions and audit events     | Authorize publication or transaction                        |
| Identify missing information         | Enforce specialist-review blocks     | Resolve safety/hazard questions                             |

Gemini must never issue the final quantity, structural decision, hazard clearance, buyer rank, compliance status or approval.

## Monorepo layout

Use **pnpm workspaces, Turborepo and TypeScript**.

```text
rebuild-loop/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   ├── (auth)/
│   │   │   ├── (workspace)/projects/[projectId]/
│   │   │   │   ├── overview/
│   │   │   │   ├── intake/
│   │   │   │   ├── inventory/
│   │   │   │   ├── pathways/
│   │   │   │   ├── matches/
│   │   │   │   └── recovery-plan/
│   │   │   └── api/
│   │   │       ├── v1/
│   │   │       └── health/
│   │   ├── src/http/
│   │   ├── next.config.ts
│   │   └── Dockerfile
│   └── worker/
│       ├── src/tasks/
│       └── Dockerfile
├── packages/
│   ├── feature-projects/
│   ├── feature-intake/
│   ├── feature-inventory/
│   ├── feature-recovery/
│   ├── feature-matching/
│   ├── feature-plans/
│   ├── feature-passports/
│   ├── ai/
│   ├── contracts/
│   ├── db/
│   ├── jobs/
│   ├── storage/
│   ├── auth/
│   ├── observability/
│   ├── ui/
│   └── config/
├── tooling/
├── docs/
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .env.example
```

Each feature is a vertical slice:

```text
packages/feature-inventory/src/
├── domain/
├── application/
├── infrastructure/
├── schemas/
└── index.ts
```

Route Handlers only authenticate, validate, authorize, invoke a use case and return a typed result. Business rules do not live in `route.ts`, React components or model prompts.

The worker is not a second backend. It exposes no public API and consumes durable jobs created by Route Handlers.

## Source of truth and background work

- PostgreSQL is the authoritative database.
- Use Drizzle or another TypeScript-first ORM with checked migrations.
- Use a PostgreSQL-backed queue such as Graphile Worker to avoid adding Redis for the MVP.
- Configure worker concurrency to one or two on the VPS.
- Store media in private S3-compatible object storage with persistent volumes.
- Use presigned uploads; do not relay large videos through the Next.js process.
- Keep original media outside Gemini. Files uploaded to Gemini's Files API are temporary, not product storage. See [Gemini Files API](https://ai.google.dev/gemini-api/docs/files).

Every job needs a typed payload, idempotency key, retry limit, exponential backoff, ownership check, immutable run record and structured logs.

## Core data model

```text
Identity:       users, sessions, organisations, organisation_members
Projects:       projects, project_sites, media_assets, boq_documents, uploads
AI provenance:  analysis_runs, analysis_inputs, model_outputs, prompt_versions
Inventory:      inventory_candidates, inventory_items, inventory_revisions,
                review_decisions
Decisions:      recovery_rule_versions, pathway_assessments,
                impact_factor_versions, impact_results
Matching:       buyer_demands, match_runs, material_matches
Plans:          recovery_plans, recovery_plan_items, plan_approvals,
                material_passports, cd_waste_plans
Operations:     audit_events, job_runs
```

Keep `inventory_candidates` separate from human-confirmed `inventory_items`. Never overwrite a raw model result when a reviewer changes it.

Project state machine:

```text
DRAFT
→ INTAKE_READY
→ ANALYSING
→ REVIEW_REQUIRED
→ INVENTORY_CONFIRMED
→ PLAN_DRAFTED
→ APPROVED
```

## API surface

```text
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/:projectId
PATCH  /api/v1/projects/:projectId

POST   /api/v1/projects/:projectId/uploads/initiate
POST   /api/v1/projects/:projectId/uploads/:uploadId/complete
GET    /api/v1/projects/:projectId/media
POST   /api/v1/projects/:projectId/boq

POST   /api/v1/projects/:projectId/analyses
GET    /api/v1/projects/:projectId/analyses/:analysisId
POST   /api/v1/projects/:projectId/analyses/:analysisId/retry

GET    /api/v1/projects/:projectId/candidates
PATCH  /api/v1/projects/:projectId/candidates/:candidateId
POST   /api/v1/projects/:projectId/candidates/:candidateId/confirm
POST   /api/v1/projects/:projectId/candidates/:candidateId/reject

POST   /api/v1/projects/:projectId/pathways/calculate
GET    /api/v1/projects/:projectId/pathways
POST   /api/v1/projects/:projectId/matches/run
GET    /api/v1/projects/:projectId/matches

POST   /api/v1/projects/:projectId/plans
GET    /api/v1/projects/:projectId/plans/:planId
POST   /api/v1/projects/:projectId/plans/:planId/approve
GET    /api/v1/projects/:projectId/plans/:planId/passport
GET    /api/v1/projects/:projectId/plans/:planId/cd-waste-plan

GET    /api/health/live
GET    /api/health/ready
```

Analysis creation returns `202 Accepted` and a durable job identifier. Matching and pathway endpoints reject projects with no human-confirmed inventory.
