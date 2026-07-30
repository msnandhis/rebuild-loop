import { describe, expect, it } from "vitest";

import { assessRecoveryPathway } from "./recovery-rules";

describe("deterministic recovery pathways", () => {
  it("blocks a timber fire door when its fire status is unknown", () => {
    const result = assessRecoveryPathway({
      materialFamily: "TIMBER",
      riskFlags: ["FIRE_RATING_UNKNOWN"],
      safetyFacts: {},
      specialistReviewRequired: false,
      unknowns: ["The fire-rating label is unreadable."],
    });

    expect(result.preferredPathway).toBe("SPECIALIST_REVIEW");
    expect(result.directReuseBlocked).toBe(true);
    expect(result.failedGates.map((gate) => gate.code)).toContain(
      "FIRE_STATUS_KNOWN",
    );
  });

  it("never allows an active specialist flag to escape into direct reuse", () => {
    const result = assessRecoveryPathway({
      materialFamily: "STEEL",
      riskFlags: [],
      safetyFacts: { structuralRole: "NON_STRUCTURAL" },
      specialistReviewRequired: true,
      unknowns: [],
    });

    expect(result.preferredPathway).toBe("SPECIALIST_REVIEW");
    expect(result.directReuseBlocked).toBe(true);
  });

  it("routes confirmed mineral material to recycling when gates pass", () => {
    const result = assessRecoveryPathway({
      materialFamily: "CONCRETE",
      riskFlags: [],
      safetyFacts: {},
      specialistReviewRequired: false,
      unknowns: [],
    });

    expect(result.preferredPathway).toBe("RECYCLE");
    expect(result.directReuseBlocked).toBe(false);
  });

  it("allows a non-mineral lot to be considered for direct reuse only after gates pass", () => {
    const result = assessRecoveryPathway({
      materialFamily: "ALUMINIUM",
      riskFlags: [],
      safetyFacts: {},
      specialistReviewRequired: false,
      unknowns: [],
    });

    expect(result.preferredPathway).toBe("DIRECT_REUSE");
    expect(result.directReuseBlocked).toBe(false);
  });
});
