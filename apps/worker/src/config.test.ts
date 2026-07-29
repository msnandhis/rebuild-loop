import { describe, expect, it } from "vitest";

import { readWorkerConfig } from "./config";

describe("worker configuration", () => {
  it("applies safe local defaults", () => {
    const config = readWorkerConfig({
      APP_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://rebuild:rebuild@localhost:5432/rebuild",
      GEMINI_API_KEY: "test-key",
    });

    expect(config.APP_ENV).toBe("development");
    expect(config.GEMINI_MODEL).toBe("gemini-3.6-flash");
    expect(config.WORKER_HEALTH_PORT).toBe(3001);
  });

  it("rejects a missing database URL", () => {
    expect(() => readWorkerConfig({})).toThrow();
  });
});
