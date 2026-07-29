# syntax=docker/dockerfile:1.7
FROM node:24.18.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/kernel/package.json packages/kernel/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY . .
RUN pnpm --filter @rebuild/worker build

FROM node:24.18.0-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup --system --gid 1001 worker \
  && adduser --system --uid 1001 rebuild
COPY --from=builder --chown=rebuild:worker /workspace/apps/worker/dist ./dist
USER rebuild
EXPOSE 3001
CMD ["node", "dist/index.js"]
