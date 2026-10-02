import { TenantRequest } from "../middleware/tenantMiddleware";
import { Response } from "express";
import { fundService } from "../services/fundService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

export const createFund = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const fund = await fundService.create({ ...req.body, organizationId: user!.organizationId });
  return res.status(201).json(fund);
};

export const listFunds = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const params = parsePagination(req);
  const result = await fundService.list(params.page, params.pageSize, user!.organizationId);
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getFund = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const fund = await fundService.getById(req.params.id as string, user!.organizationId);
  if (!fund) {
    return res.status(404).json({ error: "Fund not found" });
  }
  return res.status(200).json(fund);
};

export const updateFund = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const fund = await fundService.update(req.params.id as string, req.body, user!.organizationId);
  return res.status(200).json(fund);
};

export const deleteFund = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  await fundService.delete(req.params.id as string, user!.organizationId);
  return res.status(204).send();
};

export const fundController = { createFund, listFunds, getFund, updateFund, deleteFund };