"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disbursementController = exports.cancelDisbursement = exports.downloadPaymentVoucher = exports.getPaymentVoucher = exports.markDisbursementPaid = exports.rejectDisbursement = exports.secondApproveDisbursement = exports.firstApproveDisbursement = exports.getDisbursementRequest = exports.listDisbursementRequests = exports.createDisbursementRequest = void 0;
const prisma_1 = require("../lib/prisma");
const disbursementService_1 = require("../services/disbursementService");
const paymentVoucherService_1 = require("../services/paymentVoucherService");
const documentCurrency_1 = require("../utils/documentCurrency");
const pagination_1 = require("../utils/pagination");
async function getHeadedDepartmentIds(userId, organizationId) {
    const departments = await prisma_1.prisma.department.findMany({
        where: { headId: userId, organizationId },
        select: { id: true },
    });
    return departments.map((d) => d.id);
}
const createDisbursementRequest = async (req, res) => {
    const user = req.user;
    const body = req.body;
    let departmentId = body.departmentId || undefined;
    if (user.role === "DEPARTMENT_HEAD") {
        const headedDepartmentIds = await getHeadedDepartmentIds(user.id, user.organizationId);
        if (headedDepartmentIds.length === 0) {
            return res.status(403).json({ error: "You are not assigned to a department" });
        }
        if (departmentId && !headedDepartmentIds.includes(departmentId)) {
            return res.status(403).json({ error: "You can only submit disbursements for your own department" });
        }
        departmentId = headedDepartmentIds[0];
    }
    const request = await disbursementService_1.disbursementService.createRequest({
        amountInKobo: BigInt(body.amountInKobo),
        purpose: body.purpose,
        requestedById: user.id,
        vendorId: body.vendorId || undefined,
        departmentId,
        organizationId: user.organizationId,
        lineItems: Array.isArray(body.lineItems)
            ? body.lineItems.map((li) => ({
                description: li.description,
                amountInKobo: BigInt(li.amountInKobo),
                receiptUrl: li.receiptUrl,
            }))
            : undefined,
    });
    return res.status(201).json(request);
};
exports.createDisbursementRequest = createDisbursementRequest;
const listDisbursementRequests = async (req, res) => {
    const user = req.user;
    const { status, departmentId } = req.query;
    const params = (0, pagination_1.parsePagination)(req);
    let scopedDepartmentIds;
    if (user.role === "DEPARTMENT_HEAD") {
        scopedDepartmentIds = await getHeadedDepartmentIds(user.id, user.organizationId);
        if (scopedDepartmentIds.length === 0) {
            return res.status(200).json((0, pagination_1.buildPaginatedResponse)([], 0, params));
        }
    }
    let effectiveDepartmentId;
    if (scopedDepartmentIds) {
        if (departmentId && !scopedDepartmentIds.includes(departmentId)) {
            return res.status(403).json({ error: "You can only view your own department's disbursements" });
        }
        effectiveDepartmentId = departmentId ?? undefined;
    }
    else {
        effectiveDepartmentId = departmentId;
    }
    const result = await disbursementService_1.disbursementService.listRequests(user.organizationId, status, params.page, params.pageSize, scopedDepartmentIds, effectiveDepartmentId);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listDisbursementRequests = listDisbursementRequests;
const getDisbursementRequest = async (req, res) => {
    const user = req.user;
    const request = await disbursementService_1.disbursementService.getRequestById(req.params.id, user.organizationId);
    if (!request) {
        return res.status(404).json({ error: "Disbursement request not found" });
    }
    if (user.role === "DEPARTMENT_HEAD" && request.departmentId) {
        const headedDepartmentIds = await getHeadedDepartmentIds(user.id, user.organizationId);
        if (!headedDepartmentIds.includes(request.departmentId)) {
            return res.status(403).json({ error: "You do not have access to this disbursement" });
        }
    }
    return res.status(200).json(request);
};
exports.getDisbursementRequest = getDisbursementRequest;
const firstApproveDisbursement = async (req, res) => {
    const user = req.user;
    const request = await disbursementService_1.disbursementService.firstApprove(req.params.id, user.id, user.organizationId);
    return res.status(200).json(request);
};
exports.firstApproveDisbursement = firstApproveDisbursement;
const secondApproveDisbursement = async (req, res) => {
    const user = req.user;
    const request = await disbursementService_1.disbursementService.secondApprove(req.params.id, user.id, user.organizationId);
    return res.status(200).json(request);
};
exports.secondApproveDisbursement = secondApproveDisbursement;
const rejectDisbursement = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const request = await disbursementService_1.disbursementService.rejectRequest(req.params.id, user.id, user.organizationId, body.reason);
    return res.status(200).json(request);
};
exports.rejectDisbursement = rejectDisbursement;
const markDisbursementPaid = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const request = await disbursementService_1.disbursementService.markPaid(req.params.id, user.id, user.organizationId, {
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
        paymentNotes: body.paymentNotes,
    });
    return res.status(200).json(request);
};
exports.markDisbursementPaid = markDisbursementPaid;
/**
 * Voucher data as JSON, for the in-app print preview. Mirrors exactly what
 * `downloadPaymentVoucher` renders, including the verification hash, so the
 * screen preview and the downloaded PDF cannot disagree.
 */
const getPaymentVoucher = async (req, res) => {
    const user = req.user;
    const voucher = await disbursementService_1.disbursementService.getVoucherData(req.params.id, user.organizationId);
    if (!voucher) {
        return res.status(404).json({ error: "Disbursement request not found" });
    }
    const payer = await prisma_1.prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
    });
    const paidBy = payer?.name ?? user.email;
    const currency = (0, documentCurrency_1.normalizeCurrencyCode)(voucher.currency);
    const paidAt = voucher.paidAt;
    return res.status(200).json({
        requestId: req.params.id,
        voucherNumber: voucher.voucherNumber,
        organization: {
            id: user.organizationId,
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
        amountFormatted: (0, documentCurrency_1.formatMinorUnits)(voucher.amountInKobo, currency),
        amountInWords: (0, paymentVoucherService_1.amountInWords)(voucher.amountInKobo, currency),
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
            amountFormatted: (0, documentCurrency_1.formatMinorUnits)(item.amountInKobo, currency),
        })),
        verificationHash: (0, paymentVoucherService_1.computeVoucherHash)({
            organizationName: voucher.organizationName,
            voucherNumber: voucher.voucherNumber,
            amountInKobo: voucher.amountInKobo,
            currency,
            paidAt,
            payeeName: voucher.payeeName,
        }),
    });
};
exports.getPaymentVoucher = getPaymentVoucher;
const downloadPaymentVoucher = async (req, res) => {
    const user = req.user;
    const voucher = await disbursementService_1.disbursementService.getVoucherData(req.params.id, user.organizationId);
    if (!voucher) {
        return res.status(404).json({ error: "Disbursement request not found" });
    }
    const payer = await prisma_1.prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
    });
    (0, paymentVoucherService_1.generatePaymentVoucherPdf)(res, {
        ...voucher,
        amountInWords: (0, paymentVoucherService_1.amountInWords)(voucher.amountInKobo, voucher.currency),
        paidBy: payer?.name ?? user.email,
    }, user.organizationId);
    return undefined;
};
exports.downloadPaymentVoucher = downloadPaymentVoucher;
const cancelDisbursement = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const request = await disbursementService_1.disbursementService.cancelDisbursement(req.params.id, user.id, user.organizationId, body.reason);
    return res.status(200).json(request);
};
exports.cancelDisbursement = cancelDisbursement;
exports.disbursementController = {
    createDisbursementRequest: exports.createDisbursementRequest,
    listDisbursementRequests: exports.listDisbursementRequests,
    getDisbursementRequest: exports.getDisbursementRequest,
    firstApproveDisbursement: exports.firstApproveDisbursement,
    secondApproveDisbursement: exports.secondApproveDisbursement,
    rejectDisbursement: exports.rejectDisbursement,
    markDisbursementPaid: exports.markDisbursementPaid,
    downloadPaymentVoucher: exports.downloadPaymentVoucher,
    getPaymentVoucher: exports.getPaymentVoucher,
    cancelDisbursement: exports.cancelDisbursement,
};
//# sourceMappingURL=disbursementController.js.map