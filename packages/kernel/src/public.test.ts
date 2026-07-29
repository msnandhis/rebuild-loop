import { describe, expect, it } from "vitest";

import { PROJECT_STAGES } from "./public";

describe("project stages", () => {
  it("keeps the review journey in its approved order", () => {
    expect(PROJECT_STAGES).toHaveLength(6);
    expect(PROJECT_STAGES[0]).toBe("site-brief");
    expect(PROJECT_STAGES.at(-1)).toBe("recovery-pack");
  });
});
