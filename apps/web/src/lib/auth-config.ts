import { getDatabase } from "@rebuild/db";
import * as schema from "@rebuild/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

function requireAuthEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export const auth = betterAuth({
  appName: "ReBuild Loop",
  baseURL: requireAuthEnv("BETTER_AUTH_URL"),
  secret: requireAuthEnv("BETTER_AUTH_SECRET"),
  database: drizzleAdapter(getDatabase(), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    autoSignIn: false,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  trustedOrigins: [requireAuthEnv("APP_URL")],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 100,
    customRules: {
      "/sign-up/email": {
        window: 60 * 10,
        max: 5,
      },
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
    },
  },
  telemetry: {
    enabled: false,
  },
});

export type AuthSession = typeof auth.$Infer.Session;
