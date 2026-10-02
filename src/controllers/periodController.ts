import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { periodService } from "../services/periodService";

export const listPeriods = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const periods = await periodService.list(user!.organizationId);
  return res.status(200).json(periods);
};

export const lockPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { fiscalYear, month } = req.body as { fiscalYear: number; month: number };
  const period = await periodService.lock(fiscalYear, month, user!.organizationId, user!.id);
  return res.status(200).json(period);
};

export const unlockPeriod = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { fiscalYear, month } = req.body as { fiscalYear: number; month: number };
  const period = await periodService.unlock(fiscalYear, month, user!.organizationId, user!.id);
  return res.status(200).json(period);
};

export const periodController = {
  listPeriods,
  lockPeriod,
  unlockPeriod,
};
