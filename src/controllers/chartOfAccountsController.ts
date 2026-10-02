import { Request, Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { chartOfAccountsService } from "../services/chartOfAccountsService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

export const listAccounts = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const params = parsePagination(req);
  const result = await chartOfAccountsService.list(params.page, params.pageSize, user!.organizationId);
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getAccount = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const account = await chartOfAccountsService.getById(req.params.id as string, user!.organizationId);
  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }
  return res.status(200).json(account);
};

export const createAccount = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  try {
    const account = await chartOfAccountsService.create({ ...req.body, organizationId: user!.organizationId });
    return res.status(201).json(account);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create account';
    if (message.startsWith("Parent account code") && message.endsWith("not found")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
};

export const updateAccount = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const account = await chartOfAccountsService.update(req.params.id as string, req.body, user!.organizationId);
  return res.status(200).json(account);
};

export const deleteAccount = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  await chartOfAccountsService.delete(req.params.id as string, user!.organizationId);
  return res.status(204).send();
};

export const chartOfAccountsController = { listAccounts, getAccount, createAccount, updateAccount, deleteAccount };
