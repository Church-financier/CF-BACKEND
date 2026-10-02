import { prisma } from "../lib/prisma";

export const budgetService = {
  async create(data: {
    departmentId: string;
    fundId: string;
    fiscalYear: number;
    month: number;
    amountInKobo: bigint;
    organizationId: string;
  }) {
    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!department) {
      const err: any = new Error("Department not found in organization");
      err.code = "DEPARTMENT_NOT_FOUND";
      throw err;
    }

    const fund = await prisma.fund.findFirst({
      where: { id: data.fundId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!fund) {
      const err: any = new Error("Fund not found in organization");
      err.code = "FUND_NOT_FOUND";
      throw err;
    }

    return prisma.budget.create({
      data: {
        departmentId: data.departmentId,
        fundId: data.fundId,
        fiscalYear: data.fiscalYear,
        month: data.month,
        amountInKobo: data.amountInKobo,
        organizationId: data.organizationId,
      },
      include: {
        department: { select: { id: true, name: true } },
        fund: { select: { id: true, name: true } },
      },
    });
  },

  async list(page = 1, pageSize = 10, organizationId: string, filters?: { departmentId?: string; fundId?: string; fiscalYear?: number }) {
    const where: any = { organizationId };
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.fundId) where.fundId = filters.fundId;
    if (filters?.fiscalYear) where.fiscalYear = filters.fiscalYear;

    const [data, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          fund: { select: { id: true, name: true } },
        },
        orderBy: [{ fiscalYear: "desc" }, { month: "desc" }, { department: { name: "asc" } }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.budget.count({ where }),
    ]);
    return { data, total };
  },

  async getById(id: string, organizationId: string) {
    return prisma.budget.findFirst({
      where: { id, organizationId },
      include: {
        department: { select: { id: true, name: true } },
        fund: { select: { id: true, name: true } },
      },
    });
  },

  async update(
    id: string,
    organizationId: string,
    data: {
      departmentId?: string;
      fundId?: string;
      fiscalYear?: number;
      month?: number;
      amountInKobo?: bigint;
    }
  ) {
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: data.departmentId, organizationId },
        select: { id: true },
      });
      if (!department) {
        const err: any = new Error("Department not found in organization");
        err.code = "DEPARTMENT_NOT_FOUND";
        throw err;
      }
    }
    if (data.fundId) {
      const fund = await prisma.fund.findFirst({
        where: { id: data.fundId, organizationId },
        select: { id: true },
      });
      if (!fund) {
        const err: any = new Error("Fund not found in organization");
        err.code = "FUND_NOT_FOUND";
        throw err;
      }
    }

    await prisma.budget.updateMany({ where: { id, organizationId }, data });
    return prisma.budget.findFirst({
      where: { id, organizationId },
      include: {
        department: { select: { id: true, name: true } },
        fund: { select: { id: true, name: true } },
      },
    });
  },

  async delete(id: string, organizationId: string) {
    return prisma.budget.deleteMany({ where: { id, organizationId } });
  },
};