import { FunctionTool } from "@google/adk";
import { z } from "zod";

const specialistFlags = new Set([
  "FIRE_RATING_UNKNOWN",
  "HAZARDOUS_MATERIAL_POSSIBLE",
  "SPECIALIST_INSPECTION_REQUIRED",
  "STRUCTURAL_ROLE_POSSIBLE",
]);

export function evaluateDecisionGate(input: {
  riskFlags: string[];
  unknowns: string[];
}) {
  const blockingFlags = input.riskFlags.filter((flag) =>
    specialistFlags.has(flag),
  );

  if (blockingFlags.length > 0) {
    return {
      action: "SEND_TO_SPECIALIST",
      blockingFlags,
      reason:
        "One or more structural, fire, hazard, or specialist flags remain unresolved.",
      unresolvedUnknowns: input.unknowns,
    } as const;
  }

  if (input.unknowns.length > 0) {
    return {
      action: "REQUEST_EVIDENCE",
      blockingFlags: [],
      reason:
        "The visible evidence does not resolve every fact needed for a recovery decision.",
      unresolvedUnknowns: input.unknowns,
    } as const;
  }

  return {
    action: "READY_FOR_HUMAN_REVIEW",
    blockingFlags: [],
    reason:
      "No listed blocker remains, but a named person must still make the decision.",
    unresolvedUnknowns: [],
  } as const;
}

export const checkDecisionGate = new FunctionTool({
  name: "check_decision_gate",
  description:
    "Applies ReBuild Loop's deterministic safety gate to risk flags and unresolved unknowns. It never approves a material.",
  parameters: z.object({
    riskFlags: z
      .array(z.string())
      .describe("Risk flag codes attached to the material proposal."),
    unknowns: z
      .array(z.string())
      .describe("Facts the available evidence does not establish."),
  }),
  execute: evaluateDecisionGate,
});
