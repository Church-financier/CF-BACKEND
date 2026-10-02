import crypto from "crypto";

const TOKEN_TTL_HOURS = 24;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

export function hashTokenValue(token: string): string {
  return hashToken(token);
}

export function tokenExpiry(): Date {
  return new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
}
