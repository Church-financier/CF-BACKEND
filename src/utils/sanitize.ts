const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "currentPassword",
  "oldPassword",
  "confirmPassword",
  "token",
  "secret",
  "mfaSecret",
  "authorization",
  "cookie",
  "creditCard",
  "ssn",
]);

export function sanitizeForLog<T>(value: T, depth = 0): unknown {
  if (depth > 6) return "[depth-limit]";
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeForLog(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = "[redacted]";
    } else {
      out[key] = sanitizeForLog(val, depth + 1);
    }
  }
  return out;
}
