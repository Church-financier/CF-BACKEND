import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodOptional<z.ZodString>;
    PORT: z.ZodOptional<z.ZodString>;
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRY: z.ZodOptional<z.ZodString>;
    DOTENV_PATH: z.ZodOptional<z.ZodString>;
    SMTP_HOST: z.ZodOptional<z.ZodString>;
    SMTP_PORT: z.ZodOptional<z.ZodString>;
    SMTP_USER: z.ZodOptional<z.ZodString>;
    SMTP_PASS: z.ZodOptional<z.ZodString>;
    SMTP_FROM: z.ZodOptional<z.ZodString>;
    FRONTEND_URL: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
export declare function validateEnv(): Env;
export {};
//# sourceMappingURL=env.d.ts.map