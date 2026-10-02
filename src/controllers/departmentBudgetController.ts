import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { departmentBudgetService } from "../services/departmentBudgetService";
import { prisma } from "../lib/prisma";

export const createDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { budgetPeriodId: string; departmentId: string };
  try {
    if (user!.role === "DEPARTMENT_HEAD") {
      const dept = await prisma.department.findFirst({
        where: { id: body.departmentId, headId: user!.id, organizationId: user!.organizationId },
      });
      if (!dept) {
        return res.status(403).json({ error: "You can only create budgets for your own department" });
      }
    }
    const budget = await departmentBudgetService.create({
      budgetPeriodId: body.budgetPeriodId,
      departmentId: body.departmentId,
      submittedByUserId: user!.id,
      organizationId: user!.organizationId,
    });
    return res.status(201).json(budget);
  } catch (err: any) {
    if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "DEPARTMENT_NOT_FOUND") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "DEPARTMENT_BUDGET_EXISTS") {
      return res.status(409).json({ error: err.message });
    }
    if (err?.code === "SUBMISSION_CLOSED") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const getDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const budget = await departmentBudgetService.getById(req.params.id as string, user!.organizationId);
  if (!budget) return res.status(404).json({ error: "Department budget not found" });

  if (user!.role === "DEPARTMENT_HEAD") {
    const dept = await prisma.department.findFirst({
      where: { id: budget.departmentId, headId: user!.id, organizationId: user!.organizationId },
    });
    if (!dept) {
      return res.status(403).json({ error: "You do not have access to this budget" });
    }
  }

  return res.status(200).json(budget);
};

export const getMyDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { budgetPeriodId } = req.query as { budgetPeriodId?: string };

  if (!budgetPeriodId) {
    return res.status(400).json({ error: "budgetPeriodId is required" });
  }

  if (user!.role !== "DEPARTMENT_HEAD") {
    return res.status(403).json({ error: "Only department heads can access this endpoint" });
  }

  const dept = await prisma.department.findFirst({
    where: { headId: user!.id, organizationId: user!.organizationId },
    select: { id: true },
  });
  if (!dept) {
    return res.status(404).json({ error: "You are not a department head" });
  }

  const budget = await departmentBudgetService.getByPeriodAndDepartment(
    budgetPeriodId,
    dept.id,
    user!.organizationId
  );
  if (!budget) return res.status(404).json({ error: "Department budget not found" });

  return res.status(200).json(budget);
};

export const listDepartmentBudgetsByPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { budgetPeriodId } = req.query as { budgetPeriodId?: string };

  if (!budgetPeriodId) {
    return res.status(400).json({ error: "budgetPeriodId is required" });
  }

  try {
    const budgets = await departmentBudgetService.listByPeriod(budgetPeriodId, user!.organizationId);
    return res.status(200).json({ data: budgets });
  } catch (err: any) {
    if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
};

export const updateDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as {
    totalProposedAmount?: number;
    totalApprovedAmount?: number;
    status?: string;
    rejectionNotes?: string | null;
  };

  try {
    const budget = await departmentBudgetService.update(req.params.id as string, user!.organizationId, {
      totalProposedAmount: body.totalProposedAmount !== undefined ? BigInt(body.totalProposedAmount) : undefined,
      totalApprovedAmount: body.totalApprovedAmount !== undefined ? BigInt(body.totalApprovedAmount) : undefined,
      status: body.status as any,
      rejectionNotes: body.rejectionNotes,
    });
    if (!budget) return res.status(404).json({ error: "Department budget not found" });
    return res.status(200).json(budget);
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
};

export const submitDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  try {
    const budget = await departmentBudgetService.submit(req.params.id as string, user!.id, user!.organizationId);
    return res.status(200).json(budget);
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "UNAUTHORIZED") {
      return res.status(403).json({ error: err.message });
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

export const returnDepartmentBudgetForRevision = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { rejectionNotes: string };
  try {
    const budget = await departmentBudgetService.returnForRevision(
      req.params.id as string,
      user!.organizationId,
      body.rejectionNotes
    );
    return res.status(200).json(budget);
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const approveDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { items: { budgetItemId: string; approvedTotal: number }[] };
  try {
    const budget = await departmentBudgetService.approve(req.params.id as string, user!.organizationId,
      body.items.map((i) => ({ budgetItemId: i.budgetItemId, approvedTotal: BigInt(i.approvedTotal) }))
    );
    return res.status(200).json(budget);
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_PERIOD_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
};

export const rejectDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { rejectionNotes: string };
  try {
    const budget = await departmentBudgetService.reject(req.params.id as string, user!.organizationId, body.rejectionNotes);
    return res.status(200).json(budget);
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const deleteDepartmentBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  try {
    const result = await departmentBudgetService.delete(req.params.id as string, user!.organizationId);
    if (result.count === 0) return res.status(404).json({ error: "Department budget not found" });
    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const departmentBudgetController = {
  createDepartmentBudget,
  getDepartmentBudget,
  getMyDepartmentBudget,
  listDepartmentBudgetsByPeriod,
  updateDepartmentBudget,
  submitDepartmentBudget,
  returnDepartmentBudgetForRevision,
  approveDepartmentBudget,
  rejectDepartmentBudget,
  deleteDepartmentBudget,
};