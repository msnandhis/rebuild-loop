import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/database", () => ({
  pingDatabase: vi.fn(),
}));

import { pingDatabase } from "../../../../lib/database";
import { GET } from "./route";

const pingDatabaseMock = vi.mocked(pingDatabase);

describe("ready health route", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("reports readiness when PostgreSQL responds", async () => {
    pingDatabaseMock.mockResolvedValue();

    const response = await GET();
    const body = (await response.json()) as {
      dependencies: { database: string };
      state: string;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      state: "ok",
      dependencies: { database: "ok" },
    });
  });

  it("reports unavailability without leaking database errors", async () => {
    pingDatabaseMock.mockRejectedValue(new Error("secret connection details"));

    const response = await GET();
    const responseText = await response.text();

    expect(response.status).toBe(503);
    expect(responseText).toContain('"database":"unavailable"');
    expect(responseText).not.toContain("secret connection details");
  });
});
