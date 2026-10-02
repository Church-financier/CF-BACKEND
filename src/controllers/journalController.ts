import { TenantRequest } from "../middleware/tenantMiddleware";
import { Response } from "express";
import { journalService, JournalLineInput } from "../services/journalService";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";

interface CreateJournalBody {
  description: string;
  reference?: string;
  date?: string;
  lines: Array<{ accountId: string; description?: string; debitInKobo: number; creditInKobo: number }>;
}

export const createJournalEntry = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as CreateJournalBody;
  const lines: JournalLineInput[] = body.lines.map((l) => ({
    accountId: l.accountId,
    description: l.description,
    debitInKobo: BigInt(l.debitInKobo),
    creditInKobo: BigInt(l.creditInKobo),
  }));
  const entry = await journalService.createEntry({
    organizationId: user!.organizationId,
    description: body.description,
    reference: body.reference,
    date: body.date ? new Date(body.date) : undefined,
    createdById: user!.id,
    lines,
  });
  return res.status(201).json(entry);
};

export const listJournalEntries = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const params = parsePagination(req);
  const result = await journalService.listEntries(user!.organizationId, params.page, params.pageSize);
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const reverseJournalEntry = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { reason: string };
  const entry = await journalService.reverseEntry(
    req.params.id as string,
    user!.id,
    user!.organizationId,
    body.reason
  );
  return res.status(200).json(entry);
};

export const getTrialBalance = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { startDate, endDate } = req.query as Record<string, string | undefined>;
  const result = await journalService.getTrialBalance(
    user!.organizationId,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  );
  return res.status(200).json(result);
};

export const journalController = {
  createJournalEntry,
  listJournalEntries,
  reverseJournalEntry,
  getTrialBalance,
};