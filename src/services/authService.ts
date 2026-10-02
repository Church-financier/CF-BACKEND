import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { getJwtSecret, getJwtExpiryFromMinutes } from "../utils/jwt";
import { refreshTokenService } from "./refreshTokenService";
import { sessionActivity } from "./sessionActivity";
import { seedOrganization } from "../services/seedData";

export interface TokenPair {
  token: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
    organizationName: string;
  };
}

async function issueTokenPair(
  user: { id: string; email: string; name: string; role: string; organizationId: string; organizationName: string },
  meta?: { userAgent?: string; ipAddress?: string },
  sessionTimeoutMinutes?: number
): Promise<TokenPair> {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId, organizationName: user.organizationName },
    getJwtSecret(),
    { expiresIn: getJwtExpiryFromMinutes(sessionTimeoutMinutes) } as any
  );
  const { token: refreshToken, expiresAt } = await refreshTokenService.issue(user.id, meta);
  sessionActivity.touch(user.id, sessionTimeoutMinutes);
  return { token, refreshToken, refreshExpiresAt: expiresAt, user };
}

export const authService = {
  async register(
    email: string,
    password: string,
    name: string,
    role?: string,
    organizationId?: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<TokenPair> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const error: any = new Error("An account with this email already exists. Please sign in instead.");
      error.code = "EMAIL_TAKEN";
      throw error;
    }

    let effectiveOrganizationId = organizationId;
    if (!effectiveOrganizationId) {
      const organization = await prisma.organization.create({
        data: { name: `${name}'s Organization` },
      });
      effectiveOrganizationId = organization.id;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: ((role as Role) || "SUPER_ADMIN") as Role,
        organizationId: effectiveOrganizationId,
      },
      include: { organization: true },
    });

    await seedOrganization(effectiveOrganizationId);

    return issueTokenPair(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
      meta,
      user.organization.sessionTimeoutMinutes
    );
  },

  async registerChurch(
    churchName: string,
    adminName: string,
    email: string,
    password: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<TokenPair> {
    const organization = await prisma.organization.create({
      data: {
        name: churchName,
      },
    });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: adminName,
        role: "SUPER_ADMIN",
        organizationId: organization.id,
      },
      include: { organization: true },
    });

    await seedOrganization(organization.id);

    return issueTokenPair(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
      meta,
      user.organization.sessionTimeoutMinutes
    );
  },

  async authenticate(
    email: string,
    password: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<TokenPair> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    return issueTokenPair(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
      meta,
      user.organization.sessionTimeoutMinutes
    );
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    }).then((user) => {
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        emailVerified: user.emailVerified,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
      };
    });
  },

  async issueTokenForUser(
    user: { id: string; email: string; name: string; role: string; organizationId: string; organization: { name: string; sessionTimeoutMinutes: number } },
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<TokenPair> {
    return issueTokenPair(
      {
        id: user.id,
        email: user.email,
        name: (user as any).name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
      meta,
      user.organization.sessionTimeoutMinutes
    );
  },

  async refresh(
    presentedToken: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<TokenPair | null> {
    const rotated = await refreshTokenService.rotate(presentedToken, meta);
    if (!rotated) return null;
    const user = await prisma.user.findUnique({
      where: { id: rotated.userId },
      include: { organization: true },
    });
    if (!user) return null;

    if (sessionActivity.isExpired(rotated.userId)) {
      sessionActivity.revoke(rotated.userId);
      return null;
    }
    sessionActivity.touch(rotated.userId, user.organization.sessionTimeoutMinutes);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId, organizationName: user.organization.name },
      getJwtSecret(),
      { expiresIn: getJwtExpiryFromMinutes(user.organization.sessionTimeoutMinutes) } as any
    );
    return {
      token,
      refreshToken: rotated.token,
      refreshExpiresAt: rotated.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    };
  },

  async logout(presentedToken?: string, userId?: string): Promise<void> {
    if (presentedToken) {
      await refreshTokenService.revoke(presentedToken);
    }
    if (userId) {
      await refreshTokenService.revokeAllForUser(userId);
      sessionActivity.revoke(userId);
    }
  },
};