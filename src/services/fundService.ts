import { prisma } from "../lib/prisma";
import { computeFundBalances } from "./balanceService";

export const fundService = {
  async create(data: { name: string; description?: string; isRestricted?: boolean; organizationId: string }) {
    return prisma.fund.create({ data });
  },

  async list(page = 1, pageSize = 10, organizationId: string) {
    const [funds, total, balances] = await Promise.all([
      prisma.fund.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.fund.count({ where: { organizationId } }),
      computeFundBalances(organizationId),
    ]);

    const data = funds.map((fund) => {
      const balance = balances.get(fund.id);
      return {
        ...fund,
        inflowInKobo: balance?.inflowInKobo ?? BigInt(0),
        outflowInKobo: balance?.outflowInKobo ?? BigInt(0),
        balanceInKobo: balance?.balanceInKobo ?? BigInt(0),
      };
    });

    return { data, total };
  },
  async getById(id: string, organizationId: string) {
    return prisma.fund.findFirst({ where: { id, organizationId } });
  },
  async update(id: string, data: Partial<{ name: string; description: string; isRestricted: boolean }>, organizationId: string) {
    await prisma.fund.updateMany({ where: { id, organizationId }, data });
    return prisma.fund.findFirst({ where: { id, organizationId } });
  },
  async delete(id: string, organizationId: string) {
    const [entryCount, pledgeCount, budgetCount] = await Promise.all([
      prisma.ledgerEntry.count({ where: { fundId: id, organizationId } }),
      prisma.pledge.count({ where: { fundId: id, organizationId } }),
      prisma.budget.count({ where: { fundId: id, organizationId } }),
    ]);
    if (entryCount > 0 || pledgeCount > 0 || budgetCount > 0) {
      throw new Error("Cannot delete fund because it is referenced by existing transactions, pledges, or budgets.");
    }
    return prisma.fund.deleteMany({ where: { id, organizationId } });
  },
  async getBalance(fundId: string, organizationId: string) {
    const balances = await computeFundBalances(organizationId, [fundId]);
    return balances.get(fundId)?.balanceInKobo ?? BigInt(0);
  },
};
