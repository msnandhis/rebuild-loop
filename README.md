# AI Agent Builder Series 2026

Research, product strategy, and implementation planning for the Google × AI House hackathon.

This directory is the independent ReBuild Loop repository. Development happens
on `dev`; releases are promoted to `main`. The previous Google root is retained
outside this workspace as a recoverable legacy archive.

## Selected project

### ReBuild Loop — Pre-Demolition Circularity Agent

> Before demolition turns useful building components into mixed debris,
> ReBuild Loop turns verified site images into a human-reviewed recovery plan.

ReBuild Loop is a human-supervised decision agent for renovation and demolition
projects. Gemini turns verified site images into preliminary, evidence-linked
material observations. People confirm consequential facts before deterministic
rules create recovery routes and a versioned, auditable plan.

The current build accepts still images; it does not yet include BOQ/video intake,
buyer matching, impact calculations, or regulatory integrations.

- **Hackathon stream:** Open Innovation
- **Google AI service:** Gemini Models
- **Application stack:** Next.js 16.2, TypeScript, PostgreSQL, Docker Compose, Coolify, and S3-compatible object storage

## Documentation

The complete documentation is organized by subject in [`docs/`](docs/README.md).

### Start here

1. [Current product truth, research, and hackathon story](docs/03-rebuild-loop/09-product-truth-research-and-hackathon-story.md)
2. [Project overview, problem, and hackathon fit](docs/03-rebuild-loop/01-overview-problem-and-hackathon-fit.md)
3. [Competition and positioning](docs/03-rebuild-loop/02-competition-and-positioning.md)
4. [Product and user experience](docs/03-rebuild-loop/03-product-and-user-experience.md)
5. [Technical architecture](docs/03-rebuild-loop/04-technical-architecture.md)
6. [AI safety and evaluation](docs/03-rebuild-loop/05-ai-safety-and-evaluation.md)
7. [Demo and scoring strategy](docs/03-rebuild-loop/06-demo-and-scoring.md)
8. [Delivery and deployment](docs/03-rebuild-loop/07-delivery-and-deployment.md)
9. [Submission copy and success criteria](docs/03-rebuild-loop/08-submission-and-success-criteria.md)

## Local development

Use Node 24.18 and pnpm 11.9:

```bash
nvm use
corepack enable
pnpm install
docker compose -f compose.dev.yaml up -d postgres
cp .env.example apps/web/.env.local
# In apps/web/.env.local, use:
# DATABASE_URL=postgresql://rebuild:rebuild@localhost:55434/rebuild
pnpm --filter @rebuild/web dev
```

The web application runs at `http://localhost:3000`; PostgreSQL is isolated on
local port `55434` to avoid collisions with other development projects. The
database-backed readiness endpoint is
`http://localhost:3000/api/health/ready`.

To start the complete local environment (web, worker, PostgreSQL, and
S3-compatible object storage):

```bash
cp .env.example .env.development.local
docker compose --env-file .env.development.local -f compose.dev.yaml up --build
```

Production uses the image-only `compose.prod.yaml` contract. Coolify injects
secrets and immutable web/worker image tags; it does not build from a mutable
working directory. See the [environment and branch workflow](docs/04-engineering/05-environments-and-branching.md).

Implemented routes:

- `/` — evidence-led product introduction
- `/method` — method, responsibility, and limitations
- `/sign-up` and `/sign-in` — open email/password access without email verification
- `/projects` and `/projects/new` — project workspace and intake
- `/projects/:id/capture` — evidence upload and Gemini analysis launch
- `/projects/:id/review` — candidate queue with revision-aware human decisions
- `/projects/:id/ledger` — confirmed, append-only recovery inventory
- `/projects/:id/routes` — deterministic reuse, recycle, and specialist pathways
- `/projects/:id/pack` — draft, approval, and print-ready recovery plan
- `/projects/:id/audit` — human and agent decision history
- `/projects/demo/review` — read-only demonstration workbench
- `/api/health/live` and `/api/health/ready` — container health probes

Quality checks:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Architecture and delivery references:

- [Scalable monorepo blueprint](docs/04-engineering/01-monorepo-blueprint.md)
- [Engineering standards](docs/04-engineering/02-engineering-standards.md)
- [Vertical-slice roadmap](docs/04-engineering/03-implementation-roadmap.md)
- [Complete implementation plan](docs/04-engineering/04-complete-implementation-plan.md)
- [Development, production, Docker, and branch workflow](docs/04-engineering/05-environments-and-branching.md)
- [Field Ledger design system](design-system/rebuild-loop/MASTER.md)

## Final product principle

> **Decide what survives before the excavator arrives.**
