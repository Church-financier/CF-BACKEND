import crypto from "crypto";
import { prisma } from "../lib/prisma";

const REFRESH_TOKEN_TTL_DAYS = 30;

function generateOpaqueToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(48).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const refreshTokenService = {
  async issue(
    userId: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ token: string; expiresAt: Date }> {
    const { token, tokenHash } = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    });
    return { token, expiresAt };
  },

  async rotate(
    presentedToken: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ token: string; expiresAt: Date; userId: string } | null> {
    const tokenHash = hashToken(presentedToken);
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) return null;

    const { token: newToken, tokenHash: newHash } = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date(), replacedBy: newHash.slice(0, 16) },
      }),
      prisma.refreshToken.create({
        data: {
          userId: record.userId,
          tokenHash: newHash,
          expiresAt,
          userAgent: meta?.userAgent,
          ipAddress: meta?.ipAddress,
        },
      }),
    ]);

    return { token: newToken, expiresAt, userId: record.userId };
  },

  async revoke(presentedToken: string): Promise<void> {
    const tokenHash = hashToken(presentedToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};

export const REFRESH_COOKIE_NAME = "cf_refresh";
export const REFRESH_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}