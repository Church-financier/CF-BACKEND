import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { budgetItemService } from "../services/budgetItemService";
import { departmentBudgetService } from "../services/departmentBudgetService";
import { prisma } from "../lib/prisma";

export const createBudgetItem = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as {
    departmentBudgetId: string;
    categoryId: string;
    itemName: string;
    description?: string;
    unitCost: number;
    quantity?: number;
  };

  try {
    const deptBudget = await departmentBudgetService.getById(body.departmentBudgetId, user!.organizationId);
    if (!deptBudget) {
      return res.status(404).json({ error: "Department budget not found" });
    }

    if (user!.role === "DEPARTMENT_HEAD") {
      if (deptBudget.submittedByUserId !== user!.id) {
        return res.status(403).json({ error: "You can only add items to your own department budget" });
      }
    }

    if (!["DRAFT", "REVISED"].includes(deptBudget.status)) {
      return res.status(400).json({ error: "Cannot add items to a non-draft budget" });
    }
    if (deptBudget.budgetPeriod.status !== "SUBMISSION_OPEN" && deptBudget.budgetPeriod.status !== "UNDER_REVIEW") {
      return res.status(400).json({ error: "Budget submission window is closed" });
    }

    const proposedTotal = BigInt(body.unitCost) * BigInt(body.quantity ?? 1);

    const item = await budgetItemService.create({
      departmentBudgetId: body.departmentBudgetId,
      categoryId: body.categoryId,
      itemName: body.itemName,
      description: body.description,
      unitCost: BigInt(body.unitCost),
      quantity: body.quantity ?? 1,
      proposedTotal,
      organizationId: user!.organizationId,
    });

    await departmentBudgetService.recalculateTotals(body.departmentBudgetId, user!.organizationId);

    return res.status(201).json(item);
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_CATEGORY") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "INVALID_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "SUBMISSION_CLOSED") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

/**
 * Expense categories for the budget line-item picker.
 *
 * Scoped to `budget:read` so a department head can categorise their own
 * request without being granted organization-wide chart-of-accounts access.
 */
export const listExpenseCategories = async (req: TenantRequest, res: Response) => {
  const categories = await budgetItemService.listExpenseCategories(req.user!.organizationId);
  return res.status(200).json({ data: categories });
};

export const getBudgetItem = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const item = await budgetItemService.getById(req.params.id as string, user!.organizationId);
  if (!item) return res.status(404).json({ error: "Budget item not found" });
  return res.status(200).json(item);
};

export const listBudgetItemsByDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { departmentBudgetId } = req.query as { departmentBudgetId?: string };

  if (!departmentBudgetId) {
    return res.status(400).json({ error: "departmentBudgetId is required" });
  }

  const items = await budgetItemService.listByDepartmentBudget(departmentBudgetId, user!.organizationId);
  return res.status(200).json({ data: items });
};

export const updateBudgetItem = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as {
    categoryId?: string;
    itemName?: string;
    description?: string | null;
    unitCost?: number;
    quantity?: number;
  };

  try {
    const item = await budgetItemService.getById(req.params.id as string, user!.organizationId);
    if (!item) return res.status(404).json({ error: "Budget item not found" });

    if (user!.role === "DEPARTMENT_HEAD") {
      if (item.departmentBudget.submittedByUserId !== user!.id) {
        return res.status(403).json({ error: "You can only update items in your own department budget" });
      }
    }

    if (!["DRAFT", "REVISED"].includes(item.departmentBudget.status)) {
      return res.status(400).json({ error: "Cannot update items in a non-draft budget" });
    }
    if (item.departmentBudget.budgetPeriod.status !== "SUBMISSION_OPEN" && item.departmentBudget.budgetPeriod.status !== "UNDER_REVIEW") {
      return res.status(400).json({ error: "Budget submission window is closed" });
    }

    const proposedTotal = body.unitCost !== undefined && body.quantity !== undefined
      ? BigInt(body.unitCost) * BigInt(body.quantity)
      : body.unitCost !== undefined
        ? BigInt(body.unitCost) * BigInt(item.quantity)
        : body.quantity !== undefined
          ? item.unitCost * BigInt(body.quantity)
          : undefined;

    const updated = await budgetItemService.update(req.params.id as string, user!.organizationId, {
      categoryId: body.categoryId,
      itemName: body.itemName,
      description: body.description,
      unitCost: body.unitCost !== undefined ? BigInt(body.unitCost) : undefined,
      quantity: body.quantity,
      proposedTotal,
    });

    await departmentBudgetService.recalculateTotals(item.departmentBudgetId, user!.organizationId);

    return res.status(200).json(updated);
  } catch (err: any) {
    if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_CATEGORY") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const updateBudgetItemApprovedTotal = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { approvedTotal: number };

  try {
    const item = await budgetItemService.updateApprovedTotal(req.params.id as string, user!.organizationId, BigInt(body.approvedTotal));
    if (!item) return res.status(404).json({ error: "Budget item not found" });

    await departmentBudgetService.recalculateTotals(item.departmentBudgetId, user!.organizationId);

    return res.status(200).json(item);
  } catch (err: any) {
    if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_PERIOD_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const bulkUpdateBudgetItemApprovedTotals = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { items: { budgetItemId: string; approvedTotal: number }[] };

  try {
    await budgetItemService.bulkUpdateApprovedTotals(user!.organizationId,
      body.items.map((i) => ({ budgetItemId: i.budgetItemId, approvedTotal: BigInt(i.approvedTotal) }))
    );

    return res.status(200).json({ success: true });
  } catch (err: any) {
    if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_PERIOD_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const deleteBudgetItem = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  try {
    const item = await budgetItemService.getById(req.params.id as string, user!.organizationId);
    if (!item) return res.status(404).json({ error: "Budget item not found" });

    if (user!.role === "DEPARTMENT_HEAD") {
      if (item.departmentBudget.submittedByUserId !== user!.id) {
        return res.status(403).json({ error: "You can only delete items from your own department budget" });
      }
    }

    const deptBudgetId = item.departmentBudgetId;

    await budgetItemService.delete(req.params.id as string, user!.organizationId);
    await departmentBudgetService.recalculateTotals(deptBudgetId, user!.organizationId);

    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "SUBMISSION_CLOSED") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const budgetItemController = {
  createBudgetItem,
  listExpenseCategories,
  getBudgetItem,
  listBudgetItemsByDepartmentBudget,
  updateBudgetItem,
  updateBudgetItemApprovedTotal,
  bulkUpdateBudgetItemApprovedTotals,
  deleteBudgetItem,
};