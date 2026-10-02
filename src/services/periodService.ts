import { prisma } from "../lib/prisma";
import { auditService } from "./auditService";

export const periodService = {
  async list(organizationId: string) {
    return prisma.period.findMany({
      where: { organizationId },
      orderBy: [{ fiscalYear: "desc" }, { month: "desc" }],
    });
  },

  async get(fiscalYear: number, month: number, organizationId: string) {
    return prisma.period.findUnique({
      where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
    });
  },

  async lock(fiscalYear: number, month: number, organizationId: string, userId: string) {
    const period = await prisma.period.upsert({
      where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
      create: {
        organizationId,
        fiscalYear,
        month,
        isLocked: true,
        lockedById: userId,
        lockedAt: new Date(),
      },
      update: {
        isLocked: true,
        lockedById: userId,
        lockedAt: new Date(),
      },
    });
    await auditService.log({
      userId,
      organizationId,
      action: "PERIOD_LOCK",
      details: { fiscalYear, month },
    });
    return period;
  },

  async unlock(fiscalYear: number, month: number, organizationId: string, userId: string) {
    const period = await prisma.period.update({
      where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
      data: { isLocked: false, lockedById: null, lockedAt: null },
    });
    await auditService.log({
      userId,
      organizationId,
      action: "PERIOD_UNLOCK",
      details: { fiscalYear, month },
    });
    return period;
  },

  async isLocked(fiscalYear: number, month: number, organizationId: string): Promise<boolean> {
    const p = await prisma.period.findUnique({
      where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
    });
    return p?.isLocked ?? false;
  },
};
