"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.string().optional(),
    PORT: zod_1.z.string().optional(),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: zod_1.z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRY: zod_1.z.string().optional(),
    DOTENV_PATH: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional(),
    FRONTEND_URL: zod_1.z.string().url().optional(),
});
function validateEnv() {
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
//# sourceMappingURL=env.js.map