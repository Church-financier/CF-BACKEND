import { TenantRequest } from "../middleware/tenantMiddleware";
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { disbursementService } from "../services/disbursementService";
import { amountInWords, computeVoucherHash, generatePaymentVoucherPdf } from "../services/paymentVoucherService";
import { formatMinorUnits, normalizeCurrencyCode } from "../utils/documentCurrency";
import { parsePagination, buildPaginatedResponse } from "../utils/pagination";
import { cancelDisbursementSchema } from "../schemas";

async function getHeadedDepartmentIds(userId: string, organizationId: string): Promise<string[]> {
  const departments = await prisma.department.findMany({
    where: { headId: userId, organizationId },
    select: { id: true },
  });
  return departments.map((d) => d.id);
}

export const createDisbursementRequest = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { lineItems?: unknown[] } & Record<string, unknown>;

  let departmentId = (body.departmentId as string) || undefined;
  if (user!.role === "DEPARTMENT_HEAD") {
    const headedDepartmentIds = await getHeadedDepartmentIds(user!.id, user!.organizationId);
    if (headedDepartmentIds.length === 0) {
      return res.status(403).json({ error: "You are not assigned to a department" });
    }
    if (departmentId && !headedDepartmentIds.includes(departmentId)) {
      return res.status(403).json({ error: "You can only submit disbursements for your own department" });
    }
    departmentId = headedDepartmentIds[0];
  }

  const request = await disbursementService.createRequest({
    amountInKobo: BigInt(body.amountInKobo as number),
    purpose: body.purpose as string,
    requestedById: user!.id,
    vendorId: (body.vendorId as string) || undefined,
    departmentId,
    organizationId: user!.organizationId,
    lineItems: Array.isArray(body.lineItems)
      ? (body.lineItems as Array<{ description: string; amountInKobo: number; receiptUrl?: string }>).map((li) => ({
          description: li.description,
          amountInKobo: BigInt(li.amountInKobo),
          receiptUrl: li.receiptUrl,
        }))
      : undefined,
  });
  return res.status(201).json(request);
};

export const listDisbursementRequests = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const { status, departmentId } = req.query as Record<string, string | undefined>;
  const params = parsePagination(req);

  let scopedDepartmentIds: string[] | undefined;
  if (user!.role === "DEPARTMENT_HEAD") {
    scopedDepartmentIds = await getHeadedDepartmentIds(user!.id, user!.organizationId);
    if (scopedDepartmentIds.length === 0) {
      return res.status(200).json(buildPaginatedResponse([], 0, params));
    }
  }

  let effectiveDepartmentId: string | undefined;
  if (scopedDepartmentIds) {
    if (departmentId && !scopedDepartmentIds.includes(departmentId)) {
      return res.status(403).json({ error: "You can only view your own department's disbursements" });
    }
    effectiveDepartmentId = departmentId ?? undefined;
  } else {
    effectiveDepartmentId = departmentId;
  }

  const result = await disbursementService.listRequests(
    user!.organizationId,
    status,
    params.page,
    params.pageSize,
    scopedDepartmentIds,
    effectiveDepartmentId
  );
  return res.status(200).json(buildPaginatedResponse(result.data, result.total, params));
};

export const getDisbursementRequest = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const request = await disbursementService.getRequestById(req.params.id as string, user!.organizationId);
  if (!request) {
    return res.status(404).json({ error: "Disbursement request not found" });
  }
  if (user!.role === "DEPARTMENT_HEAD" && request.departmentId) {
    const headedDepartmentIds = await getHeadedDepartmentIds(user!.id, user!.organizationId);
    if (!headedDepartmentIds.includes(request.departmentId)) {
      return res.status(403).json({ error: "You do not have access to this disbursement" });
    }
  }
  return res.status(200).json(request);
};

export const firstApproveDisbursement = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const request = await disbursementService.firstApprove(
    req.params.id as string,
    user!.id,
    user!.organizationId
  );
  return res.status(200).json(request);
};

export const secondApproveDisbursement = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const request = await disbursementService.secondApprove(
    req.params.id as string,
    user!.id,
    user!.organizationId
  );
  return res.status(200).json(request);
};

export const rejectDisbursement = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { reason?: string };
  const request = await disbursementService.rejectRequest(
    req.params.id as string,
    user!.id,
    user!.organizationId,
    body.reason
  );
  return res.status(200).json(request);
};

export const markDisbursementPaid = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { paymentMethod: string; paymentReference?: string; paymentNotes?: string };
  const request = await disbursementService.markPaid(
    req.params.id as string,
    user!.id,
    user!.organizationId,
    {
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,
      paymentNotes: body.paymentNotes,
    }
  );
  return res.status(200).json(request);
};

/**
 * Voucher data as JSON, for the in-app print preview. Mirrors exactly what
 * `downloadPaymentVoucher` renders, including the verification hash, so the
 * screen preview and the downloaded PDF cannot disagree.
 */
export const getPaymentVoucher = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const voucher = await disbursementService.getVoucherData(
    req.params.id as string,
    user!.organizationId
  );

  if (!voucher) {
    return res.status(404).json({ error: "Disbursement request not found" });
  }

  const payer = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { name: true },
  });
  const paidBy = payer?.name ?? user!.email;
  const currency = normalizeCurrencyCode(voucher.currency);
  const paidAt = voucher.paidAt;

  return res.status(200).json({
    requestId: req.params.id as string,
    voucherNumber: voucher.voucherNumber,
    organization: {
      id: user!.organizationId,
      name: voucher.organizationName,
      address: voucher.organizationAddress ?? null,
      phone: voucher.organizationPhone ?? null,
      email: voucher.organizationEmail ?? null,
      logoUrl: voucher.organizationLogoUrl ?? null,
      timezone: voucher.timezone ?? "Africa/Lagos",
      currency,
    },
    paidAt,
    purpose: voucher.purpose,
    payeeName: voucher.payeeName,
    payeeBankDetails: voucher.payeeBankDetails,
    amountInKobo: voucher.amountInKobo.toString(),
    amountFormatted: formatMinorUnits(voucher.amountInKobo, currency),
    amountInWords: amountInWords(voucher.amountInKobo, currency),
    paymentMethod: voucher.paymentMethod,
    paymentReference: voucher.paymentReference,
    paymentNotes: voucher.paymentNotes,
    requestedBy: voucher.requestedBy,
    firstApprovedBy: voucher.firstApprovedBy,
    secondApprovedBy: voucher.secondApprovedBy,
    paidBy,
    status: "PAID",
    lineItems: voucher.lineItems.map((item) => ({
      description: item.description,
      amountInKobo: item.amountInKobo.toString(),
      amountFormatted: formatMinorUnits(item.amountInKobo, currency),
    })),
    verificationHash: computeVoucherHash({
      organizationName: voucher.organizationName,
      voucherNumber: voucher.voucherNumber,
      amountInKobo: voucher.amountInKobo,
      currency,
      paidAt,
      payeeName: voucher.payeeName,
    }),
  });
};

export const downloadPaymentVoucher = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const voucher = await disbursementService.getVoucherData(
    req.params.id as string,
    user!.organizationId
  );

  if (!voucher) {
    return res.status(404).json({ error: "Disbursement request not found" });
  }

  const payer = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { name: true },
  });

  generatePaymentVoucherPdf(
    res,
    {
      ...voucher,
      amountInWords: amountInWords(voucher.amountInKobo, voucher.currency),
      paidBy: payer?.name ?? user!.email,
    },
    user!.organizationId
  );
  return undefined;
};

export const cancelDisbursement = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const body = req.body as { reason: string };
  const request = await disbursementService.cancelDisbursement(
    req.params.id as string,
    user!.id,
    user!.organizationId,
    body.reason
  );
  return res.status(200).json(request);
};

export const disbursementController = {
  createDisbursementRequest,
  listDisbursementRequests,
  getDisbursementRequest,
  firstApproveDisbursement,
  secondApproveDisbursement,
  rejectDisbursement,
  markDisbursementPaid,
  downloadPaymentVoucher,
  getPaymentVoucher,
  cancelDisbursement,
};