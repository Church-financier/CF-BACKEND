import { ZodSchema } from "zod";

export const validateSchema = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten();
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }
  return result.data;
};

export const validateOptional = <T>(schema: ZodSchema<T>, data: unknown): T | null => {
  if (data === undefined || data === null) return null;
  return validateSchema(schema, data);
};