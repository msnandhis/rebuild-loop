export type ProjectStatus =
  | "APPROVED"
  | "ANALYSING"
  | "DRAFT"
  | "INTAKE_READY"
  | "INVENTORY_CONFIRMED"
  | "PLAN_DRAFTED"
  | "REVIEW_REQUIRED";

type StatusTone = "attention" | "blocked" | "evidence" | "neutral" | "verified";

interface ProjectStatusView {
  /** Short state label for a status tag. */
  label: string;
  /** The action the operator has to take next, as a terse imperative. */
  next: string;
  tone: StatusTone;
}

/**
 * One source of truth for how a project status reads, so the register, the
 * project shell, and the brief cannot drift into three different vocabularies.
 */
export const PROJECT_STATUS: Record<ProjectStatus, ProjectStatusView> = {
  ANALYSING: {
    label: "Analysing",
    next: "Analysis running",
    tone: "evidence",
  },
  APPROVED: {
    label: "Approved",
    next: "Print or revisit the pack",
    tone: "verified",
  },
  DRAFT: {
    label: "Brief",
    next: "Add site evidence",
    tone: "attention",
  },
  INTAKE_READY: {
    label: "Capture",
    next: "Start an analysis",
    tone: "evidence",
  },
  INVENTORY_CONFIRMED: {
    label: "Ledger",
    next: "Calculate recovery routes",
    tone: "verified",
  },
  PLAN_DRAFTED: {
    label: "Pack",
    next: "Review and approve",
    tone: "attention",
  },
  REVIEW_REQUIRED: {
    label: "Review",
    next: "Decide on proposals",
    tone: "attention",
  },
};

export function projectStatusView(status: string): ProjectStatusView {
  return PROJECT_STATUS[status as ProjectStatus] ?? PROJECT_STATUS.DRAFT;
}
