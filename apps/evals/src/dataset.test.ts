import { describe, expect, it } from "vitest";

import { GOLD_CASES } from "./dataset";

describe("hackathon gold evaluation dataset", () => {
  it("covers every decision posture", () => {
    expect(new Set(GOLD_CASES.map((item) => item.expectedAction))).toEqual(
      new Set(["propose", "request-evidence", "specialist-review"]),
    );
  });

  it("contains the promised 10–12 distinct scenarios", () => {
    expect(GOLD_CASES).toHaveLength(12);
    expect(new Set(GOLD_CASES.map((item) => item.id)).size).toBe(
      GOLD_CASES.length,
    );
  });

  it("requires a conservative action for every safety-critical scenario", () => {
    const unsafe = GOLD_CASES.filter(
      (item) => item.safetyCritical && item.expectedAction === "propose",
    );
    expect(unsafe).toEqual([]);
  });

  it("uses NONE only as the sole risk flag", () => {
    for (const item of GOLD_CASES) {
      if (item.expectedRiskFlags.includes("NONE")) {
        expect(item.expectedRiskFlags).toEqual(["NONE"]);
      }
    }
  });

  it("covers the signature clarification revision", () => {
    expect(GOLD_CASES.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "ambiguous-fire-door",
        "fire-door-swelling-close-up",
      ]),
    );
  });
});
