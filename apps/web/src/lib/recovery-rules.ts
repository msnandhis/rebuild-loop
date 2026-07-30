export type RecoveryPathway =
  | "DIRECT_REUSE"
  | "RECYCLE"
  | "RESIDUAL"
  | "SAME_SITE_REUSE"
  | "SPECIALIST_REVIEW";

export interface RecoveryGateResult {
  alternativePathway: RecoveryPathway | null;
  directReuseBlocked: boolean;
  explanation: string;
  failedGates: Array<{ code: string; label: string; reason: string }>;
  firedRuleIds: string[];
  passedGates: Array<{ code: string; label: string; reason: string }>;
  preferredPathway: RecoveryPathway;
  preparationRequirements: string[];
}

export interface RecoveryRuleInput {
  materialFamily: string;
  riskFlags: string[];
  safetyFacts: Record<string, unknown>;
  specialistReviewRequired: boolean;
  unknowns: string[];
}

const rubbleFamilies = new Set(["BRICK", "CONCRETE"]);

export function assessRecoveryPathway(
  input: RecoveryRuleInput,
): RecoveryGateResult {
  const flags = input.riskFlags.map((item) => item.toLowerCase());
  const unknowns = input.unknowns.map((item) => item.toLowerCase());
  const failed: RecoveryGateResult["failedGates"] = [];
  const passed: RecoveryGateResult["passedGates"] = [];

  gate(
    failed,
    passed,
    "HUMAN_CONFIRMATION_REQUIRED",
    "Human confirmation",
    true,
    "This lot is present in the human-confirmed materials ledger.",
    "A human must accept or correct the proposal before routing.",
  );
  const fireRelevant =
    input.materialFamily === "TIMBER" ||
    input.materialFamily === "FIXTURES" ||
    includesAny(flags, ["fire"]) ||
    includesAny(unknowns, ["fire", "rating"]);
  const fireKnown =
    !fireRelevant ||
    isKnownSafetyFact(input.safetyFacts, [
      "fireRating",
      "fireRatingStatus",
      "fireStatus",
    ]);
  gate(
    failed,
    passed,
    "FIRE_STATUS_KNOWN",
    "Fire-rating status",
    fireKnown,
    fireRelevant
      ? "A human-recorded fire-rating status is available."
      : "A fire-rating gate is not applicable to this lot.",
    "Fire-rating status is unknown; direct and same-site reuse are blocked.",
  );

  const hazardRaised =
    includesAny(flags, ["hazard", "asbestos", "lead", "contamin"]) ||
    includesAny(unknowns, ["hazard", "asbestos", "lead", "contamin"]);
  const hazardKnown =
    !hazardRaised ||
    isKnownSafetyFact(input.safetyFacts, [
      "hazardStatus",
      "hazards",
      "contaminationStatus",
    ]);
  gate(
    failed,
    passed,
    "HAZARD_STATUS_KNOWN",
    "Hazard status",
    hazardKnown,
    hazardRaised
      ? "A human-recorded hazard status is available."
      : "No hazard uncertainty was recorded for this lot.",
    "Hazard or contamination status is unknown; direct and same-site reuse are blocked.",
  );

  const structuralRaised =
    ["BRICK", "CONCRETE", "STEEL", "TIMBER"].includes(input.materialFamily) &&
    (includesAny(flags, ["structur", "load"]) ||
      includesAny(unknowns, ["structur", "load"]));
  const structuralKnown =
    !structuralRaised ||
    isKnownSafetyFact(input.safetyFacts, [
      "structuralRole",
      "structuralStatus",
      "loadBearing",
    ]);
  gate(
    failed,
    passed,
    "STRUCTURAL_ROLE_KNOWN",
    "Structural role",
    structuralKnown,
    structuralRaised
      ? "A human-recorded structural role is available."
      : "No structural-role uncertainty was recorded for this lot.",
    "Structural role is unknown; direct and same-site reuse are blocked.",
  );
  gate(
    failed,
    passed,
    "SPECIALIST_FLAG_CLEARED",
    "Specialist review",
    !input.specialistReviewRequired,
    "No specialist-review flag is active.",
    "A specialist-review flag is active; only specialist review may be assigned.",
  );

  const directReuseBlocked = failed.length > 0;
  const preferredPathway: RecoveryPathway = directReuseBlocked
    ? "SPECIALIST_REVIEW"
    : rubbleFamilies.has(input.materialFamily)
      ? "RECYCLE"
      : "DIRECT_REUSE";

  return {
    alternativePathway:
      preferredPathway === "DIRECT_REUSE"
        ? "RECYCLE"
        : preferredPathway === "RECYCLE"
          ? "RESIDUAL"
          : null,
    directReuseBlocked,
    explanation: directReuseBlocked
      ? `${failed.map((item) => item.reason).join(" ")} Reuse cannot be assigned until these facts are resolved.`
      : preferredPathway === "RECYCLE"
        ? "Human confirmation and all applicable safety gates passed. This mineral lot is routed to controlled recycling."
        : "Human confirmation and all applicable safety gates passed. Direct reuse may be considered subject to the recorded preparation requirements.",
    failedGates: failed,
    firedRuleIds: [
      "HUMAN_CONFIRMATION_REQUIRED",
      "FIRE_STATUS_KNOWN",
      "HAZARD_STATUS_KNOWN",
      "STRUCTURAL_ROLE_KNOWN",
      "SPECIALIST_FLAG_CLEARED",
    ],
    passedGates: passed,
    preferredPathway,
    preparationRequirements:
      preferredPathway === "SPECIALIST_REVIEW"
        ? ["Keep segregated and obtain the named specialist evidence."]
        : preferredPathway === "RECYCLE"
          ? ["Segregate from mixed waste.", "Record recycler handover."]
          : ["Protect during removal.", "Verify dimensions before allocation."],
  };
}

function gate(
  failed: RecoveryGateResult["failedGates"],
  passed: RecoveryGateResult["passedGates"],
  code: string,
  label: string,
  condition: boolean,
  passReason: string,
  failReason: string,
) {
  (condition ? passed : failed).push({
    code,
    label,
    reason: condition ? passReason : failReason,
  });
}

function isKnownSafetyFact(
  safety: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.some((key) => {
    const value = safety[key];
    if (typeof value === "boolean") return true;
    if (typeof value !== "string") return false;
    const normalized = value.trim().toUpperCase();
    return (
      normalized.length > 0 &&
      !["UNKNOWN", "UNVERIFIED", "NOT_KNOWN", "PENDING"].includes(normalized)
    );
  });
}

function includesAny(values: string[], needles: string[]) {
  return values.some((value) =>
    needles.some((needle) => value.includes(needle)),
  );
}
