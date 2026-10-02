import { Request, Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { authService } from "../services/authService";
import { authTokenService } from "../services/authTokenService";
import { mailerService } from "../services/mailerService";
import { auditService } from "../services/auditService";
import { prisma } from "../lib/prisma";
import { refreshTokenService, REFRESH_COOKIE_NAME, refreshCookieOptions } from "../services/refreshTokenService";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function getRequestMeta(req: Request) {
  const ua = (req.headers["user-agent"] as string | undefined) || undefined;
  const xff = (req.headers["x-forwarded-for"] as string | undefined) || "";
  const ip = xff.split(",")[0]?.trim() || req.socket.remoteAddress || undefined;
  return { userAgent: ua, ipAddress: ip };
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function isLockedOut(user: { lockoutUntil?: Date | null; failedLoginCount: number }): boolean {
  if (!user.lockoutUntil) return false;
  return new Date(user.lockoutUntil) > new Date();
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (isLockedOut(user)) {
      return res.status(403).json({ error: "Account locked due to too many failed attempts. Try again later." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const nextCount = user.failedLoginCount + 1;
      const lockoutUntil = nextCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: nextCount, lockoutUntil: lockoutUntil || undefined },
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockoutUntil: null },
    });

    if (user.mfaEnabled) {
      const code = await authTokenService.createMfaChallenge(user.id);
      mailerService.sendMfaCode(email, code).catch((e) => console.error("[MFA email error]", e));
      return res.status(200).json({ mfaRequired: true, userId: user.id });
    }

    const result = await authService.authenticate(email, password, getRequestMeta(req));
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json(result);
  } catch {
    return res.status(401).json({ error: "Invalid credentials" });
  }
};

export const verifyMfa = async (req: Request, res: Response) => {
  const { userId, code } = req.body as { userId: string; code: string };
  const ok = await authTokenService.consumeMfaChallenge(userId, code);
  if (!ok) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const nextCount = user.failedLoginCount + 1;
      const lockoutUntil = nextCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: nextCount, lockoutUntil: lockoutUntil || undefined },
      });
    }
    return res.status(401).json({ error: "Invalid or expired MFA code" });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
  if (!user) return res.status(401).json({ error: "User not found" });
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockoutUntil: null },
  });
  const token = await authService.issueTokenForUser(user, getRequestMeta(req));
  setRefreshCookie(res, token.refreshToken);
  return res.status(200).json(token);
};

export const enableMfa = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const secret = crypto.randomBytes(16).toString("hex");
  await prisma.user.update({ where: { id: user!.id }, data: { mfaEnabled: true, mfaSecret: secret } });
  return res.status(200).json({ mfaEnabled: true });
};

export const disableMfa = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  await prisma.user.update({ where: { id: user!.id }, data: { mfaEnabled: false, mfaSecret: null } });
  return res.status(200).json({ mfaEnabled: false });
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;
  try {
    const result = await authService.register(email, password, name, role, undefined, getRequestMeta(req));
    const verifyToken = await authTokenService.createEmailVerification(result.user.id);
    mailerService.sendEmailVerification(email, verifyToken).catch((e) => console.error("[verify-email error]", e));
    setRefreshCookie(res, result.refreshToken);
    return res.status(201).json(result);
  } catch (err: any) {
    console.error("[SIGNUP FAILED]", err);
    if (err.code === "EMAIL_TAKEN") {
      return res.status(409).json({ error: err.message });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already exists. Please use a different email or sign in." });
    }
    if (err.code === "P2021" || err.code === "P2022" || /column .* does not exist/i.test(err.message || "")) {
      return res.status(500).json({
        error: "Database schema is out of date. Please run `npx prisma migrate deploy` in the backend folder and restart the server.",
      });
    }
    if (err.code === "P1001" || /Can't reach database/i.test(err.message || "")) {
      return res.status(500).json({ error: "Cannot reach the database. Check your DATABASE_URL." });
    }
    return res.status(500).json({ error: err?.message || "Failed to create account" });
  }
};

export const registerChurch = async (req: Request, res: Response) => {
  const { churchName, adminName, email, password } = req.body;
  try {
    const result = await authService.registerChurch(churchName, adminName, email, password, getRequestMeta(req));
    const verifyToken = await authTokenService.createEmailVerification(result.user.id);
    mailerService.sendEmailVerification(email, verifyToken).catch((e) => console.error("[verify-email error]", e));
    setRefreshCookie(res, result.refreshToken);
    return res.status(201).json(result);
  } catch (err: any) {
    console.error("[REGISTER CHURCH FAILED]", err);
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Email already exists. Please use a different email or sign in." });
    }
    if (err?.code === "P2021" || err?.code === "P2022" || /column .* does not exist/i.test(err?.message || "")) {
      return res.status(500).json({
        error: "Database schema is out of date. Please run `npx prisma migrate deploy` in the backend folder and restart the server.",
      });
    }
    if (err?.code === "P1001" || /Can't reach database/i.test(err?.message || "")) {
      return res.status(500).json({ error: "Cannot reach the database. Check your DATABASE_URL." });
    }
    return res.status(500).json({ error: err?.message || "Failed to create organization" });
  }
};

export const logout = async (req: TenantRequest, res: Response) => {
  const presented = (req as Request).cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logout(presented, req.user?.id);
  clearRefreshCookie(res);
  return res.status(200).json({ message: "Logged out successfully" });
};

export const refresh = async (req: Request, res: Response) => {
  const presented = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!presented) return res.status(401).json({ error: "No refresh token" });
  const pair = await authService.refresh(presented, getRequestMeta(req));
  if (!pair) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
  setRefreshCookie(res, pair.refreshToken);
  return res.status(200).json(pair);
};

export const me = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const fullUser = await authService.getUserById(user.id);
  return res.status(200).json({ user: fullUser });
};

export const updateProfile = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const body = req.body as { name?: string; email?: string };

  try {
    if (body.email && body.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.email ? { email: body.email, emailVerified: false } : {}),
      },
      include: { organization: true },
    });

    await auditService.log({ userId: user.id, action: "user.updateProfile", details: { changed: Object.keys(body) } });

    const serialized = await authService.getUserById(updated.id);
    return res.status(200).json({ user: serialized });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    return res.status(500).json({ error: err?.message || "Failed to update profile" });
  }
};

export const changePassword = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });

  await auditService.log({ userId: user.id, action: "user.changePassword", details: {} });

  return res.status(200).json({ message: "Password changed successfully" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const token = await authTokenService.createPasswordReset(email);
  if (token) {
    mailerService.sendPasswordReset(email, token).catch((e) => console.error("[password-reset email error]", e));
  }
  return res.status(200).json({ message: "If an account exists, a reset link has been sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const hash = await bcrypt.hash(newPassword, 12);
  const ok = await authTokenService.consumePasswordReset(token, hash);
  if (!ok) return res.status(400).json({ error: "Invalid or expired token" });
  return res.status(200).json({ message: "Password reset successfully" });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.body as { token: string };
  const ok = await authTokenService.consumeEmailVerification(token);
  if (!ok) return res.status(400).json({ error: "Invalid or expired token" });
  return res.status(200).json({ message: "Email verified" });
};

export const authController = {
  login,
  verifyMfa,
  enableMfa,
  disableMfa,
  signup,
  registerChurch,
  logout,
  refresh,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
