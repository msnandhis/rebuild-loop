# Development, Production, Docker, and Branch Workflow

## Repository branches

Use a small release-flow model:

```text
feature/<ticket> ──pull request──> dev ──release pull request──> main
                                      |
                                      └─ local/integration validation

main ──tag──> Coolify production deployment
```

### `dev`

- Default active development and integration branch.
- All normal work starts from the latest `dev`.
- Local Docker and CI run against `dev`.
- The branch may contain incomplete work only when it remains behind a disabled feature boundary and does not break migrations, tests, or builds.

### `main`

- Production-ready history only.
- Every merge comes from a reviewed `dev` release pull request.
- Every production deployment uses a tagged commit such as `v0.1.0`.
- Direct feature work and force pushes are prohibited.

### Feature branches

- Naming: `feature/<ticket>-<short-name>`, `fix/<ticket>-<short-name>`, or `docs/<short-name>`.
- Rebase or merge the latest `dev` before review.
- Delete after merge.

### Emergency fixes

Create `hotfix/<short-name>` from `main`, test it, merge it into `main`, deploy a patch tag, then merge the same fix back into `dev`.

## Environment matrix

| Environment       | Source                  | Runtime              | Data                       | Purpose                                     |
| ----------------- | ----------------------- | -------------------- | -------------------------- | ------------------------------------------- |
| Local development | Feature branch or `dev` | Docker Compose       | Disposable/local volumes   | Development and destructive tests           |
| CI                | Pull request commit     | Ephemeral containers | Fresh database/bucket      | Migration, unit, integration, browser tests |
| Production        | Tagged `main` commit    | VPS through Coolify  | Persistent private volumes | Public demo and real users                  |

There is no separate staging environment for the first hackathon release. Production receives only smoke tests with a dedicated test account. Destructive end-to-end tests run locally or in CI.

## Local Docker

The implementation will add `compose.dev.yaml` with:

```text
web           Next.js dev/production-like container
worker        Graphile Worker consumer
postgres      PostgreSQL 18
object-store  MinIO
migrate       one-shot Drizzle migration task
bucket-init   one-shot private bucket creation
```

Expected command:

```bash
cp .env.example .env.development.local
docker compose --env-file .env.development.local -f compose.dev.yaml up --build
```

Local ports:

| Service       | Host exposure                               |
| ------------- | ------------------------------------------- |
| Web           | `127.0.0.1:3000`                            |
| PostgreSQL    | `127.0.0.1:5432` for development tools only |
| MinIO API     | `127.0.0.1:9000`                            |
| MinIO console | `127.0.0.1:9001`                            |
| Worker        | No public port                              |

Local volumes live under Docker-managed named volumes and may be removed only with an explicit reset command.

### Local verification

Before merging into `dev`:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose --env-file .env.development.local -f compose.dev.yaml up -d --build
pnpm test:e2e
```

Required smoke flow:

```text
register
→ sign in
→ create project
→ upload image
→ run analysis
→ review candidate
→ sign out
```

## Production on VPS/Coolify

The implementation will add `compose.prod.yaml`. Coolify deploys only tagged `main` commits.

Services:

```text
web           public through Coolify/Traefik HTTPS
worker        private network only
postgres      private persistent volume
object-store  private persistent volume
migrate       one-shot pre-release task
bucket-init   one-shot idempotent task
```

Only `web` receives a public domain. PostgreSQL, MinIO, and worker ports are never exposed publicly.

### Production configuration

Configure secrets in Coolify, not in Git:

```text
APP_URL
BETTER_AUTH_URL
BETTER_AUTH_SECRET
DATABASE_URL
GEMINI_API_KEY
GEMINI_MODEL
S3_ENDPOINT
S3_REGION
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY
S3_FORCE_PATH_STYLE
```

Production values must differ from local defaults. `BETTER_AUTH_SECRET`, database password, and storage credentials require long random values. No secret uses the `NEXT_PUBLIC_` prefix.

### Release procedure

1. Merge tested feature work into `dev`.
2. Run the full local and CI pipeline.
3. Open a release pull request from `dev` to `main`.
4. Confirm database migration is forward-compatible.
5. Merge and create a semantic release tag.
6. Trigger Coolify from the tag/approved `main` commit.
7. Run the one-shot migration before the new web/worker containers accept work.
8. Verify liveness and readiness.
9. Run the production smoke test with the dedicated test account.
10. Preserve the previous working image for rollback.

### Production smoke test

Allowed:

- Register/sign in with the dedicated test account.
- Create a clearly named smoke-test project.
- Upload one small consented test image.
- Run one Gemini analysis.
- Confirm pages, worker, storage, and logs.
- Delete or archive the smoke project through an explicit supported workflow.

Not allowed:

- Database resets.
- Destructive migration experiments.
- Load tests.
- Automated account floods.
- Unlabelled synthetic outputs.
- Direct edits to production tables.

### Backup and rollback

- Snapshot PostgreSQL and object storage before every release that changes schema or evidence storage.
- Retain at least the previous known-good web and worker image.
- Test one local restore before the public demo.
- Roll back application images only when the database migration is backward-compatible.
- Prefer a forward fix when a migration cannot be safely reversed.

## Environment parity rules

- Use the same Node, pnpm, PostgreSQL, migration, and application image versions locally and in production.
- Development may expose database/storage ports to localhost; production never does.
- Local media may use disposable data; production uses private persistent volumes.
- `GEMINI_MODEL` is pinned in both environments.
- Cached or seeded model results are explicitly labelled.
- Health checks never call Gemini.
- All authentication and project-ownership checks run identically in every environment.

## First repository setup

The first implementation commit on `dev` should add:

1. Node/pnpm workspace manifests.
2. Next.js web app and worker packages.
3. Tailwind and Field Ledger tokens.
4. Drizzle schema and migrations.
5. Better Auth.
6. `compose.dev.yaml` and `compose.prod.yaml`.
7. Dockerfiles and one-shot migration/bucket-init tasks.
8. CI for format, lint, typecheck, tests, build, migration-from-empty, and container smoke test.
