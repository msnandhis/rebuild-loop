# AI Agent Builder Series 2026

Research, product strategy, and implementation planning for the Google × AI House hackathon.

This directory is the independent ReBuild Loop repository. Development happens
on `dev`; releases are promoted to `main`. The previous Google root is retained
outside this workspace as a recoverable legacy archive.

## Selected project

### ReBuild Loop — Pre-Demolition Circularity Agent

> Before demolition turns reusable building components into mixed rubble, ReBuild Loop turns a phone walkthrough into a human-reviewed recovery plan and matched reuse opportunities.

ReBuild Loop is an evidence-first decision agent for Indian renovation and demolition projects. Gemini extracts a preliminary, confidence-scored inventory from site media and optional BOQs. Humans verify consequential facts before deterministic rules calculate recovery pathways, matching, and potential impact.

- **Hackathon stream:** Open Innovation
- **Google AI service:** Gemini Models
- **Application stack:** Next.js 16.2, TypeScript, PostgreSQL, Docker Compose, Coolify, and S3-compatible object storage

## Documentation

The complete documentation is organized by subject in [`docs/`](docs/README.md).

### Start here

1. [Project overview, problem, and hackathon fit](docs/03-rebuild-loop/01-overview-problem-and-hackathon-fit.md)
2. [Competition and positioning](docs/03-rebuild-loop/02-competition-and-positioning.md)
3. [Product and user experience](docs/03-rebuild-loop/03-product-and-user-experience.md)
4. [Technical architecture](docs/03-rebuild-loop/04-technical-architecture.md)
5. [AI safety and evaluation](docs/03-rebuild-loop/05-ai-safety-and-evaluation.md)
6. [Demo and scoring strategy](docs/03-rebuild-loop/06-demo-and-scoring.md)
7. [Delivery and deployment](docs/03-rebuild-loop/07-delivery-and-deployment.md)
8. [Submission copy and success criteria](docs/03-rebuild-loop/08-submission-and-success-criteria.md)

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
- `/projects/demo/review` — interactive three-part review workbench
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
