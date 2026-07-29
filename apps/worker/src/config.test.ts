import { describe, expect, it } from "vitest";

import { readWorkerConfig } from "./config";

describe("worker configuration", () => {
  it("applies safe local defaults", () => {
    const config = readWorkerConfig({
      DATABASE_URL: "postgresql://rebuild:rebuild@localhost:5432/rebuild",
    });

    expect(config.APP_ENV).toBe("development");
    expect(config.WORKER_HEALTH_PORT).toBe(3001);
  });

  it("rejects a missing database URL", () => {
    expect(() => readWorkerConfig({})).toThrow();
  });
});
