# Evidence-to-proposal slice

## Shipped boundary

This slice implements one narrow, auditable path:

1. An authenticated project owner selects up to six JPEG, PNG, or WebP images.
2. The browser hashes each image and receives a ten-minute signed upload URL.
3. Bytes land under a random `incoming/<upload-session-id>` object key.
4. A durable PostgreSQL job verifies actual size, decodes the image under a
   pixel limit, detects its real type, computes the server SHA-256, and promotes
   it to an immutable evidence key.
5. The owner explicitly starts an analysis from READY evidence IDs.
6. A durable worker normalises the images, sends the immutable manifest to
   Gemini, validates the structured output, and publishes candidate revisions
   only after shape and semantic validation pass.
7. The review queue and candidate detail keep source evidence, model proposal,
   uncertainty, and the future human decision layer visually separate.

Human decision recording and clarification submission are intentionally not
part of this slice. Their database foundations are present, but the interface
does not imply that a model proposal is an approval.

## Runtime components

- `apps/web`: authenticated routes, upload orchestration, capture, analysis
  status, and read-only proposal review.
- `apps/worker`: durable verification and Gemini analysis tasks.
- PostgreSQL: source of truth plus a small `workflow_jobs` queue claimed with
  `FOR UPDATE SKIP LOCKED`.
- S3-compatible private object storage: temporary incoming objects and immutable
  final evidence.
- Gemini `gemini-3.6-flash`: preliminary, structured evidence analysis.

The PostgreSQL queue is deliberately domain-owned for this hackathon build. It
keeps job creation in the same transaction as the domain state change and
avoids a second queue control plane. Tasks are idempotent, use opaque IDs, and
recover stale locks on worker startup.

## Security and provenance invariants

- Every project-child query includes both `project_id` and `owner_user_id`.
- Browser requests never supply an owner ID or object key.
- A signed incoming URL can never overwrite READY evidence.
- Object-store buckets remain private; signed URLs are short-lived and are not
  persisted.
- Client MIME, extension, size, and checksum are hints, not verification.
- READY evidence identity fields are immutable in PostgreSQL.
- Analysis inputs, model outputs, candidate revisions, and evidence references
  are append-only.
- An evidence reference must belong to the immutable manifest for that run.
- Uploaded text is untrusted evidence, never a model instruction.
- Invalid or out-of-manifest model output publishes no proposal.

## Required environment

```dotenv
APP_URL=https://rebuildloop.example.com
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.6-flash
S3_INTERNAL_ENDPOINT=http://object-store:9000
S3_PUBLIC_ENDPOINT=https://uploads.example.com
S3_REGION=auto
S3_BUCKET=rebuild-loop
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_FORCE_PATH_STYLE=true
```

`S3_PUBLIC_ENDPOINT` must be the exact host used in browser requests. Rewriting
the host after signing invalidates the signature. Bucket CORS is restricted to
the exact `APP_URL` origin.

## Deferred next slice

- Accept, correct, reject, request-evidence, and specialist-review decisions.
- Clarification task submission and immutable candidate revision comparison.
- Analysis retry as a new linked run.
- Per-user storage and model-spend quotas.
- Orphan incoming-object and stale-domain-state sweeps.
- Video, document/BOQ intake, recovery routes, marketplace matching, and export.
