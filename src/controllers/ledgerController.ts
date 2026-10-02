import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { ledgerService } from "../services/ledgerService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

export const createLedgerEntry = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { amountInKobo: number; type: any; fundId: string; description: string; memberId?: string };
  const entry = await ledgerService.createEntry({
    amountInKobo: BigInt(body.amountInKobo),
    type: body.type,
    fundId: body.fundId,
    description: body.description,
    recordedById: user!.id,
    organizationId: user!.organizationId,
    memberId: body.memberId,
  });
  return res.status(201).json(entry);
};

export const listLedgerEntries = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { fundId, startDate, endDate } = req.query as Record<string, string | undefined>;
  const params = parsePagination(req);
  const result = await ledgerService.listEntries(
    user!.organizationId,
    fundId,
    startDate,
    endDate,
    params.page,
    params.pageSize
  );
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getLedgerEntry = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const entry = await ledgerService.getEntry(req.params.id as string, user!.organizationId);
  if (!entry) {
    return res.status(404).json({ error: "Ledger entry not found" });
  }
  return res.status(200).json(entry);
};

export const reverseLedgerEntry = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { reversalReason: string };
  const result = await ledgerService.reverseEntry(
    req.params.id as string,
    body.reversalReason,
    user!.id,
    user!.organizationId
  );
  return res.status(200).json(result);
};

export const ledgerController = {
  createLedgerEntry,
  listLedgerEntries,
  getLedgerEntry,
  reverseLedgerEntry,
};