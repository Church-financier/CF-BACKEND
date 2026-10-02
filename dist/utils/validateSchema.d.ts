import { ZodSchema } from "zod";
export declare const validateSchema: <T>(schema: ZodSchema<T>, data: unknown) => T;
export declare const validateOptional: <T>(schema: ZodSchema<T>, data: unknown) => T | null;
//# sourceMappingURL=validateSchema.d.ts.map