import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRY: z.string().optional(),
  DOTENV_PATH: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const raw = { ...process.env };

  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error("\n[env] Invalid environment configuration:\n" + missing + "\n");
    throw new Error("Invalid environment configuration. Check logs for details.");
  }

  const env = parsed.data;

  if (env.NODE_ENV === "production" && env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }

  return env;
}
