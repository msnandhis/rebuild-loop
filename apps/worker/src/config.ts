import { z } from "zod";

const configSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  WORKER_HEALTH_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
});

export type WorkerConfig = z.infer<typeof configSchema>;

export function readWorkerConfig(
  input: NodeJS.ProcessEnv = process.env,
): WorkerConfig {
  return configSchema.parse(input);
}
