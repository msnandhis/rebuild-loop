import { z } from "zod";

const configSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.6-flash"),
  WORKER_HEALTH_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
});

export type WorkerConfig = z.infer<typeof configSchema>;

export function readWorkerConfig(
  input: NodeJS.ProcessEnv = process.env,
): WorkerConfig {
  return configSchema.parse(input);
}
