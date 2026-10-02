import { prisma } from "../lib/prisma";

export const departmentService = {
  async create(data: { name: string; description?: string; headId: string; organizationId: string }) {
    return prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
        headId: data.headId,
        organizationId: data.organizationId,
      },
    });
  },

  async list(page = 1, pageSize = 10, organizationId: string) {
    const [data, total] = await Promise.all([
      prisma.department.findMany({
        where: { organizationId },
        include: { head: { select: { id: true, name: true, email: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.department.count({ where: { organizationId } }),
    ]);
    return { data, total };
  },

  async listForHead(page = 1, pageSize = 10, headId: string, organizationId: string) {
    const [data, total] = await Promise.all([
      prisma.department.findMany({
        where: { organizationId, headId },
        include: { head: { select: { id: true, name: true, email: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.department.count({ where: { organizationId, headId } }),
    ]);
    return { data, total };
  },

  async getById(id: string, organizationId: string) {
    return prisma.department.findFirst({
      where: { id, organizationId },
      include: { head: { select: { id: true, name: true, email: true } } },
    });
  },

  async update(id: string, data: { name?: string; description?: string; headId?: string }, organizationId: string) {
    await prisma.department.updateMany({ where: { id, organizationId }, data });
    return prisma.department.findFirst({
      where: { id, organizationId },
      include: { head: { select: { id: true, name: true, email: true } } },
    });
  },

  async delete(id: string, organizationId: string) {
    const [disbursementCount, headCount, budgetCount] = await Promise.all([
      prisma.disbursementRequest.count({ where: { departmentId: id, organizationId } }),
      prisma.user.count({ where: { headId: id, organizationId } }),
      prisma.budget.count({ where: { departmentId: id, organizationId } }),
    ]);
    if (disbursementCount > 0 || headCount > 0 || budgetCount > 0) {
      throw new Error("Cannot delete department because it is referenced by disbursement requests, users, or budgets.");
    }
    return prisma.department.deleteMany({ where: { id, organizationId } });
  },
};