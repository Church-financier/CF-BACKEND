import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { budgetPeriodService } from "../services/budgetPeriodService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";
import { prisma } from "../lib/prisma";

export const createBudgetPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { fiscalYear: number; submissionDeadline?: string };
  try {
    const period = await budgetPeriodService.create({
      fiscalYear: body.fiscalYear,
      submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : undefined,
      organizationId: user!.organizationId,
    });
    return res.status(201).json(period);
  } catch (err: any) {
    if (err?.code === "BUDGET_PERIOD_EXISTS") {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
};

export const listBudgetPeriods = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const params = parsePagination(req);
  const result = await budgetPeriodService.list(params.page, params.pageSize, user!.organizationId);
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getBudgetPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const period = await budgetPeriodService.getById(req.params.id as string, user!.organizationId);
  if (!period) return res.status(404).json({ error: "Budget period not found" });
  return res.status(200).json(period);
};

export const getActiveBudgetPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const period = await budgetPeriodService.getActive(user!.organizationId);
  if (!period) return res.status(200).json(null);
  return res.status(200).json(period);
};

export const updateBudgetPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { fiscalYear?: number; status?: string; submissionDeadline?: string | null };
  try {
    const period = await budgetPeriodService.update(req.params.id as string, user!.organizationId, {
      fiscalYear: body.fiscalYear,
      status: body.status as any,
      submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : null,
    });
    if (!period) return res.status(404).json({ error: "Budget period not found" });
    return res.status(200).json(period);
  } catch (err: any) {
    if (err?.code === "BUDGET_PERIOD_EXISTS") {
      return res.status(409).json({ error: err.message });
    }
    if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
};

export const openBudgetSubmission = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { submissionDeadline: string };
  try {
    const period = await budgetPeriodService.openSubmission(
      req.params.id as string,
      user!.organizationId,
      new Date(body.submissionDeadline)
    );
    return res.status(200).json(period);
  } catch (err: any) {
    if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_PERIOD_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const closeBudgetSubmission = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  try {
    const period = await budgetPeriodService.closeSubmission(req.params.id as string, user!.organizationId);
    return res.status(200).json(period);
  } catch (err: any) {
    if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "INVALID_PERIOD_STATUS") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const approveAndLockBudgetPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  try {
    const period = await budgetPeriodService.approveAndLock(req.params.id as string, user!.organizationId);
    return res.status(200).json(period);
  } catch (err: any) {
    if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "ALREADY_LOCKED") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const deleteBudgetPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  try {
    const result = await budgetPeriodService.delete(req.params.id as string, user!.organizationId);
    if (result.count === 0) return res.status(404).json({ error: "Budget period not found" });
    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err?.code === "PERIOD_LOCKED") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
};

export const budgetPeriodController = {
  createBudgetPeriod,
  listBudgetPeriods,
  getBudgetPeriod,
  getActiveBudgetPeriod,
  updateBudgetPeriod,
  openBudgetSubmission,
  closeBudgetSubmission,
  approveAndLockBudgetPeriod,
  deleteBudgetPeriod,
};