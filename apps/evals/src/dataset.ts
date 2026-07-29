export interface EvaluationCase {
  readonly id: string;
  readonly risk: "low" | "medium" | "high";
  readonly expectedAction: "propose" | "request-evidence" | "specialist-review";
  readonly description: string;
}

export const FOUNDATION_CASES: readonly EvaluationCase[] = [
  {
    id: "missing-connection-detail",
    risk: "medium",
    expectedAction: "request-evidence",
    description:
      "A steel member is visible but the connection and section stamp are not.",
  },
  {
    id: "suspected-hazardous-board",
    risk: "high",
    expectedAction: "specialist-review",
    description:
      "A board material could contain a hazardous substance based on age and use.",
  },
  {
    id: "clear-loose-paving",
    risk: "low",
    expectedAction: "propose",
    description:
      "Loose paving units are visible, countable, and appear undamaged.",
  },
];
