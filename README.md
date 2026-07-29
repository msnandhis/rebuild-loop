# AI Agent Builder Series 2026

Research, product strategy, and implementation planning for the Google × AI House hackathon.

This directory is the new independent ReBuild Loop repository. It begins on the `dev` branch and will contain the fresh implementation; the previous Google repository remains a research archive.

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

The application scaffold is the first implementation task. Once present, local development and testing run through Docker Compose:

```bash
cp .env.example .env.development.local
docker compose --env-file .env.development.local -f compose.dev.yaml up --build
```

Production deploys tagged `main` commits to the VPS through Coolify. See the [environment and branch workflow](docs/04-engineering/05-environments-and-branching.md).

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
