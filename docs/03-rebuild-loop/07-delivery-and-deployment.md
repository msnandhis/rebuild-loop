# 12. Delivery Plan to 5 August 2026

Assumption: a focused team of one to three builders. If solo, keep the same sequence and cut visual polish before cutting the agent loop or evaluation.

## 16–17 July — Foundation

- Finalize scope, terminology, claims and demo fixture.
- Scaffold pnpm/Turborepo monorepo and Next.js 16.2.
- Create PostgreSQL schema, migrations, auth and seeded organization.
- Create Compose stack and first Coolify deployment.
- Add liveness/readiness checks and structured logging.

## 18–20 July — Intake and evidence

- Add private object storage and presigned uploads.
- Implement project, media and BOQ routes.
- Create analysis jobs and immutable run records.
- Implement Gemini structured-output contract and Zod validation.
- Render candidate inventory with evidence links.

## 21–23 July — Human review and clarification

- Implement confirm, edit, reject and specialist-review actions.
- Add candidate versus confirmed-inventory separation.
- Implement targeted evidence-request loop and re-analysis.
- Add audit events and prompt/schema versioning.

## 24–26 July — Recovery and matching

- Implement dual-lane classification and versioned rules.
- Seed 20–40 clearly labelled demand records.
- Add deterministic filters, score explanations and alternate destinations.
- Add versioned potential-impact calculations.

## 27–29 July — Plan and export

- Generate selective-deconstruction sequence.
- Build recovery pack, preliminary passport and draft waste-plan view.
- Add named approval and change history.
- Complete the seeded office/school demo project.

## 30–31 July — Evaluation and hardening

- Build the labelled evaluation set.
- Measure extraction, evidence, safety and adaptation behavior.
- Test idempotency, retries, authorization, file limits and recovery.
- Run backup/restore and deployment rollback checks.
- Fix only failures that threaten the demo or claims.

## 1–2 August — Submission v1

- Finish README setup, architecture, methodology and limitations.
- Record the three-minute demo and short share clip.
- Create thumbnail and Agent Card.
- Deploy tagged release and submit early.

## 3–4 August — Feedback iteration

- Prioritize official/structured feedback.
- Document what changed.
- Re-record only affected demo segments.
- Freeze features by the evening of 4 August.

## 5 August — Final verification

- Test the public demo from a clean browser and mobile network.
- Verify repository access, video permissions and all URLs.
- Check form fields and technology claims.
- Submit final update well before **11:59 PM IST**.

## 13. Docker and Coolify Deployment

## Compose services

```text
web           public only through Coolify/Traefik
worker        private
postgres      private with persistent volume
object-store  private with persistent volume
migrate       one-shot deployment task
```

Only `web` receives a public domain. Do not publish database, worker or object-storage ports.

Configure `output: "standalone"` in Next.js and use multi-stage, non-root Docker images. Sources: [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying), [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting), [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/), and [Coolify Compose guidance](https://coolify.io/docs/knowledge-base/docker/compose).

## Required environment variables

```text
DATABASE_URL
AUTH_SECRET
GEMINI_API_KEY
GEMINI_MODEL=gemini-3.5-flash
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY
APP_URL
```

Keep the Gemini key and storage/database credentials runtime-only. Never expose them through `NEXT_PUBLIC_*`.

## Production minimum

- HTTPS through Coolify's reverse proxy.
- Graceful shutdown.
- Database readiness check without calling Gemini.
- Worker heartbeat.
- Daily PostgreSQL backup and object-storage snapshot copied off the VPS.
- One tested restore before the finale.
- Previous working image retained for rollback.
- File-size/MIME validation, random keys and short-lived signed URLs.
- Organization-scoped authorization for every project query.
- Rate limits on uploads, analysis, retry and export.
