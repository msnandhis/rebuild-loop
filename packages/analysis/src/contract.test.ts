import { describe, expect, it } from "vitest";

import { validateAnalysisOutput } from "./contract.js";

const assetId = "e880ed3e-5d9c-4f5d-8f9d-169c533e429d";

function candidate() {
  return {
    candidateKey: "door-1",
    condition: "UNKNOWN",
    conditionConfidence: 0.4,
    evidence: [{ assetId, observation: "A timber door leaf is visible." }],
    materialFamily: "TIMBER",
    observationSummary: "Timber door leaf with condition not established.",
    overallConfidence: 0.6,
    preliminaryPathway: "SPECIALIST_REVIEW",
    quantity: {
      basis: "One visible leaf",
      confidence: 0.7,
      maximum: 1,
      minimum: 1,
      unit: "ITEM",
    },
    riskFlags: ["FIRE_RATING_UNKNOWN"],
    specialistReviewRequired: true,
    subtype: "Door leaf",
    unknowns: ["Fire rating label is not visible."],
  };
}

describe("validateAnalysisOutput", () => {
  it("accepts evidence that belongs to the manifest", () => {
    const output = validateAnalysisOutput(
      { candidates: [candidate()] },
      new Set([assetId]),
    );

    expect(output.candidates).toHaveLength(1);
  });

  it("rejects evidence outside the manifest", () => {
    expect(() =>
      validateAnalysisOutput(
        {
          candidates: [
            {
              ...candidate(),
              evidence: [
                {
                  assetId: "40422e44-cbf1-4c56-b49e-e634d1e9f47c",
                  observation: "Unsupported reference",
                },
              ],
            },
          ],
        },
        new Set([assetId]),
      ),
    ).toThrow(/outside the analysis manifest/);
  });

  it("rejects contradictory risk flags", () => {
    expect(() =>
      validateAnalysisOutput(
        {
          candidates: [
            { ...candidate(), riskFlags: ["NONE", "CONDITION_UNCERTAIN"] },
          ],
        },
        new Set([assetId]),
      ),
    ).toThrow(/NONE/);
  });
});
