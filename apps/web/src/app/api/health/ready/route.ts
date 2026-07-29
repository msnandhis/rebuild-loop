import type { ServiceHealth } from "@rebuild/kernel";

import { pingDatabase } from "../../../../lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await pingDatabase();

    const health: ServiceHealth & {
      dependencies: { database: "ok" };
    } = {
      service: "web",
      state: "ok",
      checkedAt: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      dependencies: {
        database: "ok",
      },
    };

    return Response.json(health, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    const health: ServiceHealth & {
      dependencies: { database: "unavailable" };
    } = {
      service: "web",
      state: "unavailable",
      checkedAt: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      dependencies: {
        database: "unavailable",
      },
    };

    return Response.json(health, {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 503,
    });
  }
}
