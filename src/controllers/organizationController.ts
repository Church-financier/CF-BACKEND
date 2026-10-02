import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { prisma } from "../lib/prisma";

export const getOrganization = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const org = await prisma.organization.findUnique({
    where: { id: user!.organizationId },
    select: {
      id: true,
      name: true,
      currency: true,
      fiscalYearStartMonth: true,
      timezone: true,
      requireMfa: true,
      sessionTimeoutMinutes: true,
      createdAt: true,
    },
  });
  return res.status(200).json(org);
};

export const updateOrganization = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as {
    name?: string;
    currency?: string;
    fiscalYearStartMonth?: number;
    timezone?: string;
    requireMfa?: boolean;
    sessionTimeoutMinutes?: number;
  };
  const org = await prisma.organization.update({
    where: { id: user!.organizationId },
    data: body,
    select: {
      id: true,
      name: true,
      currency: true,
      fiscalYearStartMonth: true,
      timezone: true,
      requireMfa: true,
      sessionTimeoutMinutes: true,
      createdAt: true,
    },
  });
  return res.status(200).json(org);
};

export const organizationController = { getOrganization, updateOrganization };