# syntax=docker/dockerfile:1.7
FROM node:24.18.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/kernel/package.json packages/kernel/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV BETTER_AUTH_SECRET="build-only-placeholder-not-used-at-runtime-000000"
ENV APP_URL="http://localhost:3000"
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
COPY . .
RUN pnpm --filter @rebuild/kernel build \
  && pnpm --filter @rebuild/db build \
  && pnpm --filter @rebuild/ui build \
  && pnpm --filter @rebuild/web build

FROM node:24.18.0-alpine AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/db/package.json ./packages/db/package.json
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/db/drizzle ./packages/db/drizzle
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/db/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=nextjs:nodejs /workspace/packages/db/node_modules/postgres ./node_modules/postgres
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=6 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["/bin/sh", "-c", "node packages/db/dist/migrate.js && exec node apps/web/server.js"]
