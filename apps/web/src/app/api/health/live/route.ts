import type { ServiceHealth } from "@rebuild/kernel";

export const dynamic = "force-dynamic";

export function GET() {
  const health: ServiceHealth = {
    service: "web",
    state: "ok",
    checkedAt: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
  };

  return Response.json(health, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
