import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { getJwtSecret } from "../utils/jwt";

export interface PortalTokenPayload {
  memberId: string;
  organizationId: string;
  email: string;
  type: "member-portal";
}

export interface PortalRequest extends Request {
  portalMember?: { id: string; organizationId: string; email: string; fullName: string };
}

function signPortalToken(payload: PortalTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" } as any);
}

export const portalAuthService = {
  async issueForMember(memberId: string): Promise<{ token: string; refreshToken: string }> {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || !member.portalAccess || !member.email) throw new Error("Member cannot access portal");
    const token = signPortalToken({
      memberId: member.id,
      organizationId: member.organizationId,
      email: member.email,
      type: "member-portal",
    });
    const refreshToken = jwt.sign(
      { memberId: member.id, organizationId: member.organizationId, type: "member-portal-refresh" },
      getJwtSecret(),
      { expiresIn: "30d" } as any
    );
    return { token, refreshToken };
  },

  verifyPortalToken(token: string): PortalTokenPayload | null {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as any;
      if (decoded?.type !== "member-portal") return null;
      return decoded as PortalTokenPayload;
    } catch {
      return null;
    }
  },

  verifyPortalRefreshToken(token: string): { memberId: string; organizationId: string } | null {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as any;
      if (decoded?.type !== "member-portal-refresh") return null;
      return { memberId: decoded.memberId, organizationId: decoded.organizationId };
    } catch {
      return null;
    }
  },
};

export const PORTAL_COOKIE_NAME = "cf_portal_refresh";

export function portalCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

export const portalAuthenticate = async (req: PortalRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.cookies?.["cf_portal"]) {
    token = req.cookies["cf_portal"] as string;
  }

  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const payload = portalAuthService.verifyPortalToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });

  const member = await prisma.member.findUnique({ where: { id: payload.memberId } });
  if (!member || !member.portalAccess || member.email !== payload.email) {
    return res.status(401).json({ error: "Portal access revoked" });
  }

  req.portalMember = {
    id: member.id,
    organizationId: member.organizationId,
    email: member.email!,
    fullName: member.fullName,
  };
  next();
};