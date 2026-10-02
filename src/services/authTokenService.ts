import { prisma } from "../lib/prisma";

const MFA_CODE_TTL_MIN = 10;
const RESET_TOKEN_TTL_HOURS = 1;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authTokenService = {
  async createPasswordReset(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const { token, tokenHash } = await import("../utils/token").then((m) => m.generateToken());
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });
    return token;
  },

  async consumePasswordReset(token: string, newPasswordHash: string): Promise<boolean> {
    const { hashTokenValue } = await import("../utils/token");
    const tokenHash = hashTokenValue(token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) return false;
    await prisma.$transaction([
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { password: newPasswordHash } }),
    ]);
    return true;
  },

  async createEmailVerification(userId: string): Promise<string> {
    const { token, tokenHash } = await import("../utils/token").then((m) => m.generateToken());
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return token;
  },

  async consumeEmailVerification(token: string): Promise<boolean> {
    const { hashTokenValue } = await import("../utils/token");
    const tokenHash = hashTokenValue(token);
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) return false;
    await prisma.$transaction([
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    ]);
    return true;
  },

  async createMfaChallenge(userId: string): Promise<string> {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + MFA_CODE_TTL_MIN * 60 * 1000);
    await prisma.mfaChallenge.create({ data: { userId, code, expiresAt } });
    return code;
  },

  async consumeMfaChallenge(userId: string, code: string): Promise<boolean> {
    const record = await prisma.mfaChallenge.findFirst({
      where: { userId, code, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!record) return false;
    await prisma.mfaChallenge.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return true;
  },
};
