"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeForLog = sanitizeForLog;
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
function sanitizeForLog(value, depth = 0) {
    if (depth > 6)
        return "[depth-limit]";
    if (value === null || value === undefined)
        return value;
    if (typeof value === "bigint")
        return value.toString();
    if (typeof value !== "object")
        return value;
    if (Array.isArray(value)) {
        return value.map((v) => sanitizeForLog(v, depth + 1));
    }
    const out = {};
    for (const [key, val] of Object.entries(value)) {
        if (SENSITIVE_KEYS.has(key)) {
            out[key] = "[redacted]";
        }
        else {
            out[key] = sanitizeForLog(val, depth + 1);
        }
    }
    return out;
}
//# sourceMappingURL=sanitize.js.map