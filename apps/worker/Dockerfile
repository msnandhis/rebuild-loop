# syntax=docker/dockerfile:1.7
FROM node:24.18.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/evals/package.json apps/evals/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/analysis/package.json packages/analysis/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/kernel/package.json packages/kernel/package.json
COPY packages/storage/package.json packages/storage/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN --mount=type=cache,id=rebuild-pnpm,target=/pnpm/store \
  pnpm install --filter @rebuild/worker... --frozen-lockfile --trust-lockfile

FROM dependencies AS builder
COPY . .
RUN pnpm --filter @rebuild/analysis build \
  && pnpm --filter @rebuild/db build \
  && pnpm --filter @rebuild/storage build \
  && pnpm --filter @rebuild/worker build

FROM node:24.18.0-alpine AS runner
ENV NODE_ENV=production
WORKDIR /workspace
RUN addgroup --system --gid 1001 worker \
  && adduser --system --uid 1001 rebuild
COPY --from=dependencies --chown=rebuild:worker /workspace/node_modules ./node_modules
COPY --from=dependencies --chown=rebuild:worker /workspace/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder --chown=rebuild:worker /workspace/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder --chown=rebuild:worker /workspace/apps/worker/dist ./apps/worker/dist
USER rebuild
EXPOSE 3001
CMD ["node", "apps/worker/dist/index.js"]
