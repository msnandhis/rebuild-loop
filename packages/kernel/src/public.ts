export type EnvironmentName = "development" | "test" | "production";

export type HealthState = "ok" | "degraded" | "unavailable";

export interface ServiceHealth {
  readonly service: string;
  readonly state: HealthState;
  readonly checkedAt: string;
  readonly version: string;
}

export const PROJECT_STAGES = [
  "site-brief",
  "capture",
  "review",
  "materials-ledger",
  "recovery-routes",
  "recovery-pack",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];
