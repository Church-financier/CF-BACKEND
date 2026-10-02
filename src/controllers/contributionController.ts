import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { contributionService } from "../services/contributionService";
import { buildReceiptForContribution, generateReceiptPdf } from "../services/receiptPdfService";
import { formatMinorUnits, normalizeCurrencyCode } from "../utils/documentCurrency";

export const listContributions = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { page = "1", pageSize = "10" } = req.query as Record<string, string | undefined>;
  const result = await contributionService.listAll(Number(page), Number(pageSize), user!.organizationId);
  return res.status(200).json(result);
};

export const listContributionFunds = async (req: TenantRequest, res: Response) => {
  return res.status(200).json(await contributionService.listFunds(req.user!.organizationId));
};

export const getContribution = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const entry = await contributionService.getById(req.params.id as string, user!.organizationId);
  if (!entry) {
    return res.status(404).json({ error: "Contribution not found" });
  }
  return res.status(200).json(entry);
};

export const updateContribution = async (req: TenantRequest, res: Response) => {
  const user = req.user!;
  const body = req.body as {
    memberId?: string; memberName?: string; fundId?: string; amountInKobo?: number;
    type?: "CASH" | "CHECK" | "ENVELOPE"; date?: string; notes?: string; pledgeId?: string;
  };
  const entry = await contributionService.updateContribution(req.params.id as string, {
    ...body,
    amountInKobo: body.amountInKobo === undefined ? undefined : BigInt(body.amountInKobo),
    date: body.date ? new Date(body.date) : undefined,
  }, user.organizationId, user.id);
  return res.status(200).json(entry);
};

export const deleteContribution = async (req: TenantRequest, res: Response) => {
  const user = req.user!;
  const { reason } = req.body as { reason: string };
  const result = await contributionService.deleteContribution(req.params.id as string, user.organizationId, user.id, reason);
  return res.status(200).json(result);
};

export const getMemberStatement = async (req: TenantRequest, res: Response) => {
  const statement = await contributionService.getMemberStatement(req.params.memberId as string, req.user!.organizationId);
  if (!statement) return res.status(404).json({ error: "Member not found" });
  return res.status(200).json(statement);
};

export const createSingleContribution = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as {
    memberId?: string;
    memberName?: string;
    fundId: string;
    amountInKobo: number;
    type: "CASH" | "CHECK" | "ENVELOPE";
    date?: string;
    notes?: string;
    pledgeId?: string;
  };
  const entry = await contributionService.createSingle({
    memberId: body.memberId,
    memberName: body.memberName,
    fundId: body.fundId,
    amountInKobo: BigInt(body.amountInKobo),
    type: body.type,
    date: body.date ? new Date(body.date) : undefined,
    notes: body.notes,
    recordedById: user!.id,
    organizationId: user!.organizationId,
    pledgeId: body.pledgeId,
  });
  return res.status(201).json(entry);
};

export const batchCreateContributions = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { entries: Array<{ memberId: string; memberName?: string; fundId: string; amountInKobo: number; type: "CASH" | "CHECK" | "ENVELOPE"; date?: string; notes?: string; pledgeId?: string }> };
  const result = await contributionService.batchCreate({
    entries: body.entries.map((e) => ({
      memberId: e.memberId,
      memberName: e.memberName,
      fundId: e.fundId,
      amountInKobo: BigInt(e.amountInKobo),
      type: e.type,
      date: e.date,
      notes: e.notes,
      pledgeId: e.pledgeId,
    })),
    recordedById: user!.id,
    organizationId: user!.organizationId,
  });
  return res.status(201).json(result);
};

export const generateDonorReceipt = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const receipt = await buildReceiptForContribution(user!.organizationId, req.params.id as string);
  // `amount` is a bigint, which cannot cross the wire; expose the minor-unit
  // string and a pre-formatted amount so the print template can render it
  // without re-deriving the currency's minor unit.
  return res.status(200).json({
    entryId: receipt.receiptId,
    receiptNumber: receipt.receiptNumber,
    fundId: receipt.fundId ?? "",
    fundName: receipt.fund,
    amountInKobo: receipt.amount.toString(),
    amountFormatted: formatMinorUnits(receipt.amount, receipt.currency),
    date: receipt.date,
    description: receipt.description ?? "",
    contributionMethod: receipt.paymentMethod ?? null,
    notes: receipt.reference ?? null,
    payerName: receipt.payerName ?? null,
    recordedBy: receipt.recordedBy ?? null,
    verificationHash: receipt.verificationHash,
    status: receipt.status,
    organization: {
      id: user!.organizationId,
      name: receipt.organizationName,
      address: receipt.organizationAddress ?? null,
      phone: receipt.organizationPhone ?? null,
      email: receipt.organizationEmail ?? null,
      logoUrl: receipt.organizationLogoUrl ?? null,
      timezone: receipt.timezone ?? "Africa/Lagos",
      currency: normalizeCurrencyCode(receipt.currency),
    },
  });
};

export const downloadDonorReceiptPdf = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const receiptData = await buildReceiptForContribution(user!.organizationId, req.params.id as string);

  await generateReceiptPdf(res, receiptData, user!.organizationId);
  return undefined;
};

export const contributionController = {
  listContributions,
  listContributionFunds,
  getContribution,
  updateContribution,
  deleteContribution,
  getMemberStatement,
  createSingleContribution,
  batchCreateContributions,
  generateDonorReceipt,
  downloadDonorReceiptPdf,
};
