# Engineering Standards and Boundaries

## Repository conventions

- Node, pnpm, Next.js, Gemini model, and critical dependencies are pinned.
- TypeScript enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, and `useUnknownInCatchVariables`.
- Files use kebab-case; React components use PascalCase; functions use camelCase.
- Packages expose explicit entry points without wildcard source exports.
- No package may import another package's `src/**` path.
- Changes should cover one business concern per commit.

## Web rules

- Server Components are the default.
- Client Components exist only for browser interaction.
- Server Components call query services directly rather than HTTP-calling the same Next.js process.
- Client mutations use versioned Route Handlers.
- Route Handlers only resolve session, authorize organization, parse input, call a use case, and map the response.
- API errors use RFC 9457-style problem details.
- Retriable mutations accept idempotency keys.

## Data rules

- PostgreSQL and one migration history are the source of truth.
- Every tenant-owned row carries `organisation_id`.
- Repository methods require organization scope, never only a resource ID.
- Raw model outputs and audit events are immutable.
- Human-editable records use optimistic versions.
- Candidate confirmation, project transitions, approvals, and job creation are transactional.
- ORM rows never become domain or public API types.

## Background work

- Use PostgreSQL-backed jobs; do not add Redis for the MVP.
- Task names are versioned, for example `inventory.analyse.v1`.
- Every task validates its payload, owns an idempotency key, records correlation/model/prompt/schema versions, classifies retries, and safely handles partial work.
- The worker never imports the web app and exposes no public API.

## Test pyramid

| Layer         | Tool and focus                                           |
| ------------- | -------------------------------------------------------- |
| Domain        | Vitest; rules, value objects, state transitions          |
| Application   | Vitest with in-memory ports; use-case behavior           |
| Integration   | Real PostgreSQL/object-storage adapters and transactions |
| Worker        | Idempotency, retry, and partial-completion behavior      |
| Browser       | Playwright critical journey                              |
| AI evaluation | Labelled evidence dataset, safety and extraction metrics |

Release checks:

```text
pnpm format:check
pnpm lint
pnpm boundaries
pnpm typecheck
pnpm test
pnpm test:integration
pnpm eval
pnpm build
```

## Security baseline

- Server-only secrets are validated at startup and never use `NEXT_PUBLIC_`.
- All project access is scoped by organization.
- Direct uploads use short-lived signed URLs, random keys, MIME/size/checksum validation, and completion verification.
- Consequential AI outputs require named human review.
- Logs never contain media bytes, signed URLs, tokens, or unrestricted BOQ contents.

## Dependency guardrails

Use ESLint restricted imports first and add Dependency Cruiser once the package graph is populated. CI must fail on cycles, client-to-server imports, platform-to-module imports, or private source imports.

## Avoided enterprise theatre

Do not add microservices, Kubernetes, Kafka, generic event sourcing/CQRS, repository-wide GraphQL, a workflow engine, multiple AI providers, Storybook before reusable components exist, or independent package publishing before it is needed.
