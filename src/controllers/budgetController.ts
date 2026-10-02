import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { budgetService } from "../services/budgetService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";
import { prisma } from "../lib/prisma";

export const createBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { departmentId: string; fundId: string; fiscalYear: number; month: number; amountInKobo: number };
  try {
    if (user!.role === "DEPARTMENT_HEAD") {
      const dept = await prisma.department.findFirst({
        where: { id: body.departmentId, headId: user!.id, organizationId: user!.organizationId },
      });
      if (!dept) {
        return res.status(403).json({ error: "You can only create budgets for your own department" });
      }
    }
    const budget = await budgetService.create({
      departmentId: body.departmentId,
      fundId: body.fundId,
      fiscalYear: body.fiscalYear,
      month: body.month,
      amountInKobo: BigInt(body.amountInKobo),
      organizationId: user!.organizationId,
    });
    return res.status(201).json(budget);
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_NOT_FOUND" || err?.code === "FUND_NOT_FOUND") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "A budget already exists for this department/fund/month." });
    }
    throw err;
  }
};

export const listBudgets = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const params = parsePagination(req);
  const departmentId = (req.query.departmentId as string | undefined) || undefined;
  const fundId = (req.query.fundId as string | undefined) || undefined;
  const fiscalYearRaw = req.query.fiscalYear as string | undefined;
  const fiscalYear = fiscalYearRaw ? Number(fiscalYearRaw) : undefined;

  let scopedDepartmentId = departmentId;
  if (user!.role === "DEPARTMENT_HEAD") {
    const dept = await prisma.department.findFirst({
      where: { headId: user!.id, organizationId: user!.organizationId },
      select: { id: true },
    });
    if (dept) {
      scopedDepartmentId = dept.id;
    } else {
      return res.status(200).json(buildPaginatedResponse([], 0, params));
    }
  }

  const result = await budgetService.list(params.page, params.pageSize, user!.organizationId, {
    departmentId: scopedDepartmentId,
    fundId,
    fiscalYear,
  });
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const budget = await budgetService.getById(req.params.id as string, user!.organizationId);
  if (!budget) return res.status(404).json({ error: "Budget not found" });
  if (user!.role === "DEPARTMENT_HEAD" && budget.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: budget.departmentId, headId: user!.id, organizationId: user!.organizationId },
    });
    if (!dept) {
      return res.status(403).json({ error: "You do not have access to this budget" });
    }
  }
  return res.status(200).json(budget);
};

export const updateBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { departmentId?: string; fundId?: string; fiscalYear?: number; month?: number; amountInKobo?: number };
  if (user!.role === "DEPARTMENT_HEAD") {
    const existing = await budgetService.getById(req.params.id as string, user!.organizationId);
    if (!existing) return res.status(404).json({ error: "Budget not found" });
    const dept = await prisma.department.findFirst({
      where: { id: existing.departmentId, headId: user!.id, organizationId: user!.organizationId },
    });
    if (!dept) {
      return res.status(403).json({ error: "You can only update budgets for your own department" });
    }
  }
  try {
    const budget = await budgetService.update(req.params.id as string, user!.organizationId, {
      departmentId: body.departmentId,
      fundId: body.fundId,
      fiscalYear: body.fiscalYear,
      month: body.month,
      amountInKobo: body.amountInKobo !== undefined ? BigInt(body.amountInKobo) : undefined,
    });
    if (!budget) return res.status(404).json({ error: "Budget not found" });
    return res.status(200).json(budget);
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_NOT_FOUND" || err?.code === "FUND_NOT_FOUND") {
      return res.status(400).json({ error: err.message });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "A budget already exists for this department/fund/month." });
    }
    throw err;
  }
};

export const deleteBudget = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  if (user!.role === "DEPARTMENT_HEAD") {
    const existing = await budgetService.getById(req.params.id as string, user!.organizationId);
    if (!existing) return res.status(404).json({ error: "Budget not found" });
    const dept = await prisma.department.findFirst({
      where: { id: existing.departmentId, headId: user!.id, organizationId: user!.organizationId },
    });
    if (!dept) {
      return res.status(403).json({ error: "You can only delete budgets for your own department" });
    }
  }
  const result = await budgetService.delete(req.params.id as string, user!.organizationId);
  if (result.count === 0) return res.status(404).json({ error: "Budget not found" });
  return res.status(204).send();
};

export const budgetController = { createBudget, listBudgets, getBudget, updateBudget, deleteBudget };