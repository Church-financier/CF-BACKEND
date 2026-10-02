import { prisma } from "../lib/prisma";

export const budgetItemService = {
  async create(data: {
    departmentBudgetId: string;
    categoryId: string;
    itemName: string;
    description?: string | null;
    unitCost: bigint;
    quantity: number;
    proposedTotal: bigint;
    approvedTotal?: bigint | null;
    organizationId: string;
  }) {
    const deptBudget = await prisma.departmentBudget.findFirst({
      where: { id: data.departmentBudgetId, budgetPeriod: { organizationId: data.organizationId } },
      include: { budgetPeriod: true },
    });
    if (!deptBudget) {
      const err: any = new Error("Department budget not found");
      err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
      throw err;
    }
    if (!["DRAFT", "REVISED"].includes(deptBudget.status)) {
      const err: any = new Error("Cannot add items to a non-draft budget");
      err.code = "INVALID_STATUS";
      throw err;
    }
    if (!["SUBMISSION_OPEN", "UNDER_REVIEW"].includes(deptBudget.budgetPeriod.status)) {
      const err: any = new Error("Budget submission window is closed");
      err.code = "SUBMISSION_CLOSED";
      throw err;
    }

    const category = await prisma.chartOfAccounts.findFirst({
      where: { id: data.categoryId, organizationId: data.organizationId, type: "EXPENSE", isActive: true },
    });
    if (!category) {
      const err: any = new Error("Invalid expense category");
      err.code = "INVALID_CATEGORY";
      throw err;
    }

    return prisma.budgetItem.create({
      data: {
        departmentBudgetId: data.departmentBudgetId,
        categoryId: data.categoryId,
        itemName: data.itemName,
        description: data.description,
        unitCost: data.unitCost,
        quantity: data.quantity,
        proposedTotal: data.proposedTotal,
        approvedTotal: data.approvedTotal,
      },
      include: { category: { select: { id: true, code: true, name: true, type: true } } },
    });
  },

  /**
   * Active expense accounts, for categorising budget line items.
   *
   * A department head needs to pick an expense category when building their
   * budget, but has no business browsing the whole chart of accounts. This
   * exposes just the fields the picker needs under `budget:read`.
   */
  async listExpenseCategories(organizationId: string) {
    return prisma.chartOfAccounts.findMany({
      where: { organizationId, type: "EXPENSE", isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });
  },

  async getById(id: string, organizationId: string) {
    return prisma.budgetItem.findFirst({
      where: { id, departmentBudget: { budgetPeriod: { organizationId } } },
      include: {
        category: { select: { id: true, code: true, name: true, type: true } },
        departmentBudget: {
          include: {
            budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async listByDepartmentBudget(departmentBudgetId: string, organizationId: string) {
    return prisma.budgetItem.findMany({
      where: { departmentBudgetId, departmentBudget: { budgetPeriod: { organizationId } } },
      include: { category: { select: { id: true, code: true, name: true, type: true } } },
      orderBy: { createdAt: "asc" },
    });
  },

  async update(
    id: string,
    organizationId: string,
    data: {
      categoryId?: string;
      itemName?: string;
      description?: string | null;
      unitCost?: bigint;
      quantity?: number;
      proposedTotal?: bigint;
      approvedTotal?: bigint | null;
    }
  ) {
    const item = await this.getById(id, organizationId);
    if (!item) {
      const err: any = new Error("Budget item not found");
      err.code = "BUDGET_ITEM_NOT_FOUND";
      throw err;
    }

    if (data.categoryId) {
      const category = await prisma.chartOfAccounts.findFirst({
        where: { id: data.categoryId, organizationId, type: "EXPENSE", isActive: true },
      });
      if (!category) {
        const err: any = new Error("Invalid expense category");
        err.code = "INVALID_CATEGORY";
        throw err;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.itemName !== undefined) updateData.itemName = data.itemName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.unitCost !== undefined) updateData.unitCost = data.unitCost;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.proposedTotal !== undefined) updateData.proposedTotal = data.proposedTotal;
    if (data.approvedTotal !== undefined) updateData.approvedTotal = data.approvedTotal;

    await prisma.budgetItem.updateMany({
      where: { id, departmentBudget: { budgetPeriod: { organizationId } } },
      data: updateData as any,
    });

    return this.getById(id, organizationId);
  },

  async updateApprovedTotal(id: string, organizationId: string, approvedTotal: bigint) {
    const item = await this.getById(id, organizationId);
    if (!item) {
      const err: any = new Error("Budget item not found");
      err.code = "BUDGET_ITEM_NOT_FOUND";
      throw err;
    }
    if (item.departmentBudget.budgetPeriod.status !== "UNDER_REVIEW") {
      const err: any = new Error("Cannot adjust approved amounts outside review period");
      err.code = "INVALID_PERIOD_STATUS";
      throw err;
    }

    await prisma.budgetItem.updateMany({
      where: { id, departmentBudget: { budgetPeriod: { organizationId } } },
      data: { approvedTotal },
    });

    return this.getById(id, organizationId);
  },

  async delete(id: string, organizationId: string) {
    const item = await this.getById(id, organizationId);
    if (!item) {
      const err: any = new Error("Budget item not found");
      err.code = "BUDGET_ITEM_NOT_FOUND";
      throw err;
    }
    if (!["DRAFT", "REVISED"].includes(item.departmentBudget.status)) {
      const err: any = new Error("Cannot delete items from a non-draft budget");
      err.code = "INVALID_STATUS";
      throw err;
    }
    if (!["SUBMISSION_OPEN", "UNDER_REVIEW"].includes(item.departmentBudget.budgetPeriod.status)) {
      const err: any = new Error("Budget submission window is closed");
      err.code = "SUBMISSION_CLOSED";
      throw err;
    }

    return prisma.budgetItem.deleteMany({
      where: { id, departmentBudget: { budgetPeriod: { organizationId } } },
    });
  },

  async bulkUpdateApprovedTotals(
    organizationId: string,
    updates: { budgetItemId: string; approvedTotal: bigint }[]
  ) {
    return prisma.$transaction(async (tx) => {
      for (const update of updates) {
        const item = await tx.budgetItem.findFirst({
          where: { id: update.budgetItemId, departmentBudget: { budgetPeriod: { organizationId } } },
          include: { departmentBudget: { include: { budgetPeriod: true } } },
        });
        if (!item) {
          const err: any = new Error(`Budget item ${update.budgetItemId} not found`);
          err.code = "BUDGET_ITEM_NOT_FOUND";
          throw err;
        }
        if (item.departmentBudget.budgetPeriod.status !== "UNDER_REVIEW") {
          const err: any = new Error("Cannot adjust approved amounts outside review period");
          err.code = "INVALID_PERIOD_STATUS";
          throw err;
        }

        await tx.budgetItem.update({
          where: { id: update.budgetItemId },
          data: { approvedTotal: update.approvedTotal },
        });
      }
    });
  },
};