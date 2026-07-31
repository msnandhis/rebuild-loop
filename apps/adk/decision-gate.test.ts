import { describe, expect, test } from "vitest";

import { evaluateDecisionGate } from "./decision-gate.js";

describe("ADK decision gate tool", () => {
  test("routes structural uncertainty to a specialist", () => {
    expect(
      evaluateDecisionGate({
        riskFlags: ["STRUCTURAL_ROLE_POSSIBLE"],
        unknowns: ["Steel grade"],
      }),
    ).toMatchObject({
      action: "SEND_TO_SPECIALIST",
      blockingFlags: ["STRUCTURAL_ROLE_POSSIBLE"],
    });
  });

  test("requests evidence when unknowns remain", () => {
    expect(
      evaluateDecisionGate({
        riskFlags: [],
        unknowns: ["Board thickness"],
      }),
    ).toMatchObject({
      action: "REQUEST_EVIDENCE",
      unresolvedUnknowns: ["Board thickness"],
    });
  });

  test("keeps final authority with a person", () => {
    expect(
      evaluateDecisionGate({
        riskFlags: [],
        unknowns: [],
      }),
    ).toMatchObject({ action: "READY_FOR_HUMAN_REVIEW" });
  });
});
