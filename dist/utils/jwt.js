"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = getJwtSecret;
exports.getJwtExpiry = getJwtExpiry;
exports.getJwtExpiryFromMinutes = getJwtExpiryFromMinutes;
const FALLBACK_SECRET = "fallback-secret";
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim().length === 0) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("JWT_SECRET environment variable is required in production");
        }
        return FALLBACK_SECRET;
    }
    return secret;
}
function getJwtExpiry() {
    return process.env.JWT_EXPIRY || "24h";
}
function getJwtExpiryFromMinutes(minutes) {
    if (minutes && minutes > 0)
        return `${minutes}m`;
    return getJwtExpiry();
}
//# sourceMappingURL=jwt.js.map