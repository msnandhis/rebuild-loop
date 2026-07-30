import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const projectRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  transpilePackages: [
    "@rebuild/analysis",
    "@rebuild/db",
    "@rebuild/kernel",
    "@rebuild/storage",
    "@rebuild/ui",
  ],
  // Docker runs `pnpm --filter @rebuild/web typecheck` immediately before
  // `next build`; avoid repeating the same high-memory check inside Next.
  typescript: {
    ignoreBuildErrors: process.env.NEXT_SKIP_BUILTIN_TYPECHECK === "1",
  },
};

export default nextConfig;
