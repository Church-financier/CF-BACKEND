const FALLBACK_SECRET = "fallback-secret";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    return FALLBACK_SECRET;
  }
  return secret;
}

export function getJwtExpiry(): string {
  return process.env.JWT_EXPIRY || "24h";
}

export function getJwtExpiryFromMinutes(minutes?: number): string {
  if (minutes && minutes > 0) return `${minutes}m`;
  return getJwtExpiry();
}
