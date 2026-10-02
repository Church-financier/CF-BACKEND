import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { pledgeService } from "../services/pledgeService";

export const listPledges = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { page = "1", pageSize = "10" } = req.query as Record<string, string | undefined>;
  const result = await pledgeService.listAll(Number(page), Number(pageSize), user!.organizationId);
  return res.status(200).json(result);
};

export const getPledge = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const pledge = await pledgeService.getById(req.params.id as string, user!.organizationId);
  if (!pledge) {
    return res.status(404).json({ error: "Pledge not found" });
  }
  return res.status(200).json(pledge);
};

export const createPledge = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { amountInKobo: number; startDate?: string; endDate?: string; recurring?: boolean };
  const pledge = await pledgeService.create({
    memberId: req.body.memberId,
    memberName: req.body.memberName,
    fundId: req.body.fundId,
    amountInKobo: BigInt(body.amountInKobo),
    startDate: body.startDate,
    endDate: body.endDate,
    recurring: body.recurring,
    organizationId: user!.organizationId,
  });
  return res.status(201).json(pledge);
};

export const updatePledge = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { memberId?: string; memberName?: string; fundId?: string; amountInKobo?: number; startDate?: string; endDate?: string; recurring?: boolean };
  const pledge = await pledgeService.update(
    req.params.id as string,
    { ...body, amountInKobo: body.amountInKobo !== undefined ? BigInt(body.amountInKobo) : undefined },
    user!.organizationId
  );
  return res.status(200).json(pledge);
};

export const cancelPledge = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const pledge = await pledgeService.cancel(req.params.id as string, user!.organizationId);
  return res.status(200).json(pledge);
};

export const deletePledge = async (req: TenantRequest, res: Response) => {
  const user = req.user!;
  const pledge = await pledgeService.cancel(req.params.id as string, user.organizationId);
  return res.status(200).json(pledge);
};

export const getPledgeProgress = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const progress = await pledgeService.getProgress(req.params.id as string, user!.organizationId);
  return res.status(200).json(progress);
};

export const pledgeController = {
  listPledges,
  getPledge,
  createPledge,
  updatePledge,
  cancelPledge,
  deletePledge,
  getPledgeProgress,
};
