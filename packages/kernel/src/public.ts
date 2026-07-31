export type EnvironmentName = "development" | "test" | "production";

export type HealthState = "ok" | "degraded" | "unavailable";

export interface ServiceHealth {
  readonly service: string;
  readonly state: HealthState;
  readonly checkedAt: string;
  readonly version: string;
}

export const PROJECT_STAGES = [
  "overview",
  "evidence",
  "review",
  "recovery-plan",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];
