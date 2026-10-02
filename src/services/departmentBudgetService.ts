import { prisma } from "../lib/prisma";
import { DepartmentBudgetStatus } from "@prisma/client";

export const departmentBudgetService = {
  async create(data: {
    budgetPeriodId: string;
    departmentId: string;
    submittedByUserId: string;
    organizationId: string;
  }) {
    const period = await prisma.budgetPeriod.findFirst({
      where: { id: data.budgetPeriodId, organizationId: data.organizationId },
    });
    if (!period) {
      const err: any = new Error("Budget period not found");
      err.code = "BUDGET_PERIOD_NOT_FOUND";
      throw err;
    }
    if (period.status !== "SUBMISSION_OPEN") {
      const err: any = new Error("Budget submissions are not open for this period");
      err.code = "SUBMISSION_CLOSED";
      throw err;
    }

    const department = await prisma.department.findFirst({
      where: { id: data.departmentId, organizationId: data.organizationId },
    });
    if (!department) {
      const err: any = new Error("Department not found");
      err.code = "DEPARTMENT_NOT_FOUND";
      throw err;
    }

    const existing = await prisma.departmentBudget.findUnique({
      where: { budgetPeriodId_departmentId: { budgetPeriodId: data.budgetPeriodId, departmentId: data.departmentId } },
    });
    if (existing) {
      const err: any = new Error("Department budget already exists for this period");
      err.code = "DEPARTMENT_BUDGET_EXISTS";
      throw err;
    }

    return prisma.departmentBudget.create({
      data: {
        budgetPeriodId: data.budgetPeriodId,
        departmentId: data.departmentId,
        submittedByUserId: data.submittedByUserId,
        status: "DRAFT",
      },
      include: {
        department: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        items: { include: { category: { select: { id: true, code: true, name: true } } } },
      },
    });
  },

  async getById(id: string, organizationId: string) {
    return prisma.departmentBudget.findFirst({
      where: { id, budgetPeriod: { organizationId } },
      include: {
        budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
        department: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        items: {
          include: { category: { select: { id: true, code: true, name: true, type: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async getByPeriodAndDepartment(budgetPeriodId: string, departmentId: string, organizationId: string) {
    return prisma.departmentBudget.findFirst({
      where: {
        budgetPeriodId,
        departmentId,
        budgetPeriod: { organizationId },
      },
      include: {
        department: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        items: {
          include: { category: { select: { id: true, code: true, name: true, type: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async listByPeriod(budgetPeriodId: string, organizationId: string) {
    const period = await prisma.budgetPeriod.findFirst({
      where: { id: budgetPeriodId, organizationId },
    });
    if (!period) {
      const err: any = new Error("Budget period not found");
      err.code = "BUDGET_PERIOD_NOT_FOUND";
      throw err;
    }

    return prisma.departmentBudget.findMany({
      where: { budgetPeriodId, budgetPeriod: { organizationId } },
      include: {
        department: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        items: {
          include: { category: { select: { id: true, code: true, name: true } } },
        },
      },
      orderBy: { department: { name: "asc" } },
    });
  },

  async listByUser(userId: string, organizationId: string) {
    return prisma.departmentBudget.findMany({
      where: {
        submittedByUserId: userId,
        budgetPeriod: { organizationId },
      },
      include: {
        budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
        department: { select: { id: true, name: true } },
        items: {
          include: { category: { select: { id: true, code: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async update(
    id: string,
    organizationId: string,
    data: {
      totalProposedAmount?: bigint;
      totalApprovedAmount?: bigint;
      status?: DepartmentBudgetStatus;
      rejectionNotes?: string | null;
    }
  ) {
    const budget = await this.getById(id, organizationId);
    if (!budget) {
      const err: any = new Error("Department budget not found");
      err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
      throw err;
    }

    await prisma.departmentBudget.updateMany({
      where: { id, budgetPeriod: { organizationId } },
      data: data as any,
    });

    return this.getById(id, organizationId);
  },

  async recalculateTotals(id: string, organizationId: string) {
    const items = await prisma.budgetItem.findMany({
      where: { departmentBudgetId: id, departmentBudget: { budgetPeriod: { organizationId } } },
      select: { proposedTotal: true, approvedTotal: true },
    });

    const totalProposed = items.reduce((sum, item) => sum + item.proposedTotal, BigInt(0));
    const totalApproved = items.reduce(
      (sum, item) => sum + (item.approvedTotal ?? BigInt(0)),
      BigInt(0)
    );

    await prisma.departmentBudget.updateMany({
      where: { id, budgetPeriod: { organizationId } },
      data: { totalProposedAmount: totalProposed, totalApprovedAmount: totalApproved },
    });

    return { totalProposedAmount: totalProposed, totalApprovedAmount: totalApproved };
  },

  async submit(id: string, userId: string, organizationId: string) {
    const budget = await this.getById(id, organizationId);
    if (!budget) {
      const err: any = new Error("Department budget not found");
      err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
      throw err;
    }
    if (budget.submittedByUserId !== userId) {
      const err: any = new Error("You can only submit your own department budget");
      err.code = "UNAUTHORIZED";
      throw err;
    }
    if (!["DRAFT", "REVISED"].includes(budget.status)) {
      const err: any = new Error("Only draft or revised budgets can be submitted");
      err.code = "INVALID_STATUS";
      throw err;
    }
    if (budget.budgetPeriod.status !== "SUBMISSION_OPEN") {
      const err: any = new Error("Budget submission window is closed");
      err.code = "SUBMISSION_CLOSED";
      throw err;
    }

    const totals = await this.recalculateTotals(id, organizationId);

    return prisma.departmentBudget.update({
      where: { id },
      data: { status: "SUBMITTED", totalProposedAmount: totals.totalProposedAmount },
      include: {
        budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
        department: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        items: {
          include: { category: { select: { id: true, code: true, name: true, type: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async returnForRevision(id: string, organizationId: string, rejectionNotes: string) {
    const budget = await this.getById(id, organizationId);
    if (!budget) {
      const err: any = new Error("Department budget not found");
      err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
      throw err;
    }
    if (!["SUBMITTED", "REVISED"].includes(budget.status)) {
      const err: any = new Error("Only submitted or revised budgets can be returned for revision");
      err.code = "INVALID_STATUS";
      throw err;
    }

    return prisma.departmentBudget.update({
      where: { id },
      data: { status: "REVISED", rejectionNotes },
      include: {
        budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
        department: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        items: {
          include: { category: { select: { id: true, code: true, name: true, type: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async approve(id: string, organizationId: string, itemApprovals: { budgetItemId: string; approvedTotal: bigint }[]) {
    const budget = await this.getById(id, organizationId);
    if (!budget) {
      const err: any = new Error("Department budget not found");
      err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
      throw err;
    }
    if (budget.budgetPeriod.status !== "UNDER_REVIEW") {
      const err: any = new Error("Budget period is not under review");
      err.code = "INVALID_PERIOD_STATUS";
      throw err;
    }

    return prisma.$transaction(async (tx) => {
      for (const approval of itemApprovals) {
        await tx.budgetItem.update({
          where: { id: approval.budgetItemId },
          data: { approvedTotal: approval.approvedTotal },
        });
      }

      const totals = await this.recalculateTotals(id, organizationId);

      return tx.departmentBudget.update({
        where: { id },
        data: {
          status: "APPROVED",
          totalApprovedAmount: totals.totalApprovedAmount,
        },
        include: {
          budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
          department: { select: { id: true, name: true } },
          submittedBy: { select: { id: true, name: true } },
          items: {
            include: { category: { select: { id: true, code: true, name: true, type: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });
  },

  async reject(id: string, organizationId: string, rejectionNotes: string) {
    const budget = await this.getById(id, organizationId);
    if (!budget) {
      const err: any = new Error("Department budget not found");
      err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
      throw err;
    }
    if (!["SUBMITTED", "REVISED"].includes(budget.status)) {
      const err: any = new Error("Only submitted or revised budgets can be rejected");
      err.code = "INVALID_STATUS";
      throw err;
    }

    return prisma.departmentBudget.update({
      where: { id },
      data: { status: "REJECTED", rejectionNotes },
      include: {
        budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
        department: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        items: {
          include: { category: { select: { id: true, code: true, name: true, type: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  async delete(id: string, organizationId: string) {
    const budget = await this.getById(id, organizationId);
    if (!budget) {
      const err: any = new Error("Department budget not found");
      err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
      throw err;
    }
    if (budget.status !== "DRAFT") {
      const err: any = new Error("Only draft budgets can be deleted");
      err.code = "INVALID_STATUS";
      throw err;
    }

    return prisma.departmentBudget.deleteMany({ where: { id, budgetPeriod: { organizationId } } });
  },
};