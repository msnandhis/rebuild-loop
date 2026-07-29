import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("live health route", () => {
  it("reports the web process as healthy without caching", async () => {
    const response = GET();
    const body = (await response.json()) as {
      service: string;
      state: string;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({
      service: "web",
      state: "ok",
    });
  });
});
