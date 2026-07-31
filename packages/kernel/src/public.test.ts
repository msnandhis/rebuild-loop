import { describe, expect, it } from "vitest";

import { PROJECT_STAGES } from "./public";

describe("project stages", () => {
  it("keeps the review journey in its approved order", () => {
    expect(PROJECT_STAGES).toEqual([
      "overview",
      "evidence",
      "review",
      "recovery-plan",
    ]);
  });
});
