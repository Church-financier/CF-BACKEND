"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disbursementService = void 0;
const prisma_1 = require("../lib/prisma");
const index_1 = require("../index");
const client_1 = require("@prisma/client");
const postingService_1 = require("./postingService");
const date_1 = require("../utils/date");
const documentCurrency_1 = require("../utils/documentCurrency");
const APPROVAL_THRESHOLD_KOBO = BigInt(0);
const APPROVER_ROLES = [client_1.Role.SUPER_ADMIN, client_1.Role.TREASURER];
async function assertApprover(approverId, organizationId, action = "approve disbursement requests") {
    const approver = await prisma_1.prisma.user.findFirst({
        where: {
            id: approverId,
            organizationId,
            role: { in: APPROVER_ROLES },
        },
        select: { id: true },
    });
    if (!approver) {
        throw new Error(`Only super admins and treasurers can ${action}`);
    }
}
exports.disbursementService = {
    async createRequest(data) {
        const { lineItems, ...rest } = data;
        if (lineItems && lineItems.length > 0) {
            const itemsTotal = lineItems.reduce((sum, item) => sum + BigInt(item.amountInKobo), BigInt(0));
            if (itemsTotal !== BigInt(rest.amountInKobo)) {
                throw new Error(`Line items total (${itemsTotal.toString()} kobo) does not match disbursement amount (${rest.amountInKobo.toString()} kobo)`);
            }
        }
        if (rest.vendorId) {
            const vendor = await prisma_1.prisma.vendor.findFirst({
                where: { id: rest.vendorId, organizationId: rest.organizationId },
                select: { id: true },
            });
            if (!vendor)
                throw new Error("Vendor not found in organization");
        }
        if (rest.departmentId) {
            const department = await prisma_1.prisma.department.findFirst({
                where: { id: rest.departmentId, organizationId: rest.organizationId },
                select: { id: true },
            });
            if (!department)
                throw new Error("Department not found in organization");
        }
        const requester = await prisma_1.prisma.user.findUnique({
            where: { id: rest.requestedById },
            select: { role: true },
        });
        const isElevatedInitiator = requester && APPROVER_ROLES.includes(requester.role) && !rest.departmentId;
        const createData = {
            ...rest,
            ...(isElevatedInitiator
                ? {
                    status: "FIRST_APPROVED",
                    firstApprovedById: rest.requestedById,
                }
                : {}),
            lineItems: lineItems
                ? {
                    create: lineItems.map((li) => ({
                        description: li.description,
                        amountInKobo: li.amountInKobo,
                        receiptUrl: li.receiptUrl,
                        organizationId: rest.organizationId,
                    })),
                }
                : undefined,
        };
        const request = await prisma_1.prisma.disbursementRequest.create({
            data: createData,
            include: { lineItems: true },
        });
        if (isElevatedInitiator) {
            (0, index_1.emitToOrganization)(data.organizationId, "disbursement:first_approved", { request });
        }
        else {
            (0, index_1.emitToOrganization)(data.organizationId, "disbursement:approval_requested", { request });
        }
        return request;
    },
    async listRequests(organizationId, status, page = 1, pageSize = 10, scopedDepartmentIds, departmentId) {
        const where = { organizationId };
        if (status)
            where.status = status;
        if (scopedDepartmentIds)
            where.departmentId = { in: scopedDepartmentIds };
        if (departmentId)
            where.departmentId = departmentId;
        const [data, total] = await Promise.all([
            prisma_1.prisma.disbursementRequest.findMany({
                where,
                orderBy: { createdAt: "desc" },
                include: {
                    requestedBy: { select: { name: true, email: true } },
                    firstApprovedBy: { select: { name: true, email: true } },
                    secondApprovedBy: { select: { name: true, email: true } },
                    vendor: { select: { id: true, name: true } },
                    department: { select: { id: true, name: true } },
                    lineItems: true,
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.disbursementRequest.count({ where }),
        ]);
        return { data, total };
    },
    async getRequestById(id, organizationId) {
        return prisma_1.prisma.disbursementRequest.findFirst({
            where: { id, organizationId },
            include: {
                requestedBy: { select: { name: true, email: true } },
                firstApprovedBy: { select: { name: true, email: true } },
                secondApprovedBy: { select: { name: true, email: true } },
                approvedBy: { select: { name: true, email: true } },
                vendor: true,
                department: true,
                lineItems: true,
            },
        });
    },
    async firstApprove(id, approverId, organizationId) {
        await assertApprover(approverId, organizationId);
        const request = await prisma_1.prisma.disbursementRequest.findFirst({
            where: { id, organizationId },
        });
        if (!request)
            throw new Error("Disbursement request not found");
        const approver = await prisma_1.prisma.user.findUnique({
            where: { id: approverId },
            select: { role: true },
        });
        const isElevatedRole = approver?.role === "SUPER_ADMIN" || approver?.role === "TREASURER";
        if (request.requestedById === approverId && !isElevatedRole) {
            throw new Error("You cannot approve your own disbursement request");
        }
        if (request.status !== "PENDING") {
            throw new Error(`Cannot first-approve a request in status ${request.status}`);
        }
        const updated = await prisma_1.prisma.disbursementRequest.update({
            where: { id },
            data: {
                status: "FIRST_APPROVED",
                firstApprovedById: approverId,
            },
            include: {
                lineItems: true,
                firstApprovedBy: { select: { name: true, email: true } },
                secondApprovedBy: { select: { name: true, email: true } },
            },
        });
        (0, index_1.emitToOrganization)(organizationId, "disbursement:first_approved", { request: updated });
        return updated;
    },
    async secondApprove(id, approverId, organizationId) {
        await assertApprover(approverId, organizationId);
        const request = await prisma_1.prisma.disbursementRequest.findFirst({
            where: { id, organizationId },
        });
        if (!request)
            throw new Error("Disbursement request not found");
        const approver = await prisma_1.prisma.user.findUnique({
            where: { id: approverId },
            select: { role: true },
        });
        const isElevatedRole = approver?.role === "SUPER_ADMIN" || approver?.role === "TREASURER";
        if (request.requestedById === approverId && !isElevatedRole) {
            throw new Error("You cannot approve your own disbursement request");
        }
        if (request.status !== "FIRST_APPROVED") {
            throw new Error(`Request must be in FIRST_APPROVED status to second-approve (current: ${request.status})`);
        }
        if (request.firstApprovedById === approverId && !isElevatedRole) {
            throw new Error("The first approver cannot also be the second approver");
        }
        const updated = await prisma_1.prisma.disbursementRequest.update({
            where: { id },
            data: {
                status: "APPROVED",
                secondApprovedById: approverId,
                approvedById: approverId,
            },
            include: {
                lineItems: true,
                firstApprovedBy: { select: { name: true, email: true } },
                secondApprovedBy: { select: { name: true, email: true } },
            },
        });
        (0, index_1.emitToOrganization)(organizationId, "disbursement:approved", { request: updated });
        return updated;
    },
    async rejectRequest(id, rejectedById, organizationId, reason) {
        const request = await prisma_1.prisma.disbursementRequest.findFirst({
            where: { id, organizationId },
        });
        if (!request)
            throw new Error("Disbursement request not found");
        if (request.status === "REJECTED" || request.status === "PAID") {
            throw new Error(`Cannot reject a request in status ${request.status}`);
        }
        const updated = await prisma_1.prisma.disbursementRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                approvedById: rejectedById,
                paymentNotes: reason ? `REJECTED: ${reason}` : request.paymentNotes,
            },
            include: { lineItems: true },
        });
        (0, index_1.emitToOrganization)(organizationId, "disbursement:rejected", { request: updated });
        return updated;
    },
    async markPaid(id, payerId, organizationId, paymentData) {
        await assertApprover(payerId, organizationId, "release disbursement payouts");
        const request = await prisma_1.prisma.disbursementRequest.findFirst({
            where: { id, organizationId },
        });
        if (!request)
            throw new Error("Disbursement request not found");
        if (request.status !== "APPROVED") {
            throw new Error(`Only APPROVED requests can be marked as paid (current: ${request.status})`);
        }
        const updated = await prisma_1.prisma.disbursementRequest.update({
            where: { id },
            data: {
                status: "PAID",
                paidAt: new Date(),
                paymentMethod: paymentData.paymentMethod,
                paymentReference: paymentData.paymentReference,
                paymentNotes: paymentData.paymentNotes,
            },
            include: { lineItems: true },
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                organizationId,
                userId: payerId,
                action: "DISBURSEMENT_PAID",
                details: {
                    disbursementId: id,
                    paymentMethod: paymentData.paymentMethod,
                    paymentReference: paymentData.paymentReference,
                },
            },
        });
        void (0, postingService_1.postDisbursementJournalEntry)({
            organizationId,
            createdById: payerId,
            amountInKobo: updated.amountInKobo,
            description: updated.purpose,
            date: updated.paidAt ?? undefined,
        }).catch((e) => console.error("[posting:disbursement:error]", e));
        (0, index_1.emitToOrganization)(organizationId, "disbursement:paid", { request: updated });
        return updated;
    },
    async cancelDisbursement(id, cancelledById, organizationId, reason) {
        await assertApprover(cancelledById, organizationId, "cancel disbursements");
        const request = await prisma_1.prisma.disbursementRequest.findFirst({
            where: { id, organizationId },
            include: { lineItems: true },
        });
        if (!request)
            throw new Error("Disbursement request not found");
        if (request.status === "REJECTED" || request.status === "CANCELLED") {
            throw new Error(`Cannot cancel a request in status ${request.status}`);
        }
        const updated = await prisma_1.prisma.disbursementRequest.update({
            where: { id },
            data: {
                status: "CANCELLED",
                approvedById: cancelledById,
                paymentNotes: reason ? `CANCELLED: ${reason}` : request.paymentNotes,
            },
            include: { lineItems: true },
        });
        if (request.status === "PAID") {
            await prisma_1.prisma.auditLog.create({
                data: {
                    organizationId,
                    userId: cancelledById,
                    action: "DISBURSEMENT_CANCELLED_AFTER_PAID",
                    details: {
                        disbursementId: id,
                        reason,
                        originalPaymentMethod: request.paymentMethod,
                        originalPaymentReference: request.paymentReference,
                    },
                },
            });
            void (0, postingService_1.postDisbursementJournalEntry)({
                organizationId,
                createdById: cancelledById,
                amountInKobo: -updated.amountInKobo,
                description: `REVERSAL: ${updated.purpose}`,
                date: new Date(),
            }).catch((e) => console.error("[posting:disbursement:reversal:error]", e));
        }
        else {
            await prisma_1.prisma.auditLog.create({
                data: {
                    organizationId,
                    userId: cancelledById,
                    action: "DISBURSEMENT_CANCELLED",
                    details: {
                        disbursementId: id,
                        reason,
                    },
                },
            });
        }
        (0, index_1.emitToOrganization)(organizationId, "disbursement:cancelled", { request: updated });
        return updated;
    },
    async getPendingCount(organizationId) {
        return prisma_1.prisma.disbursementRequest.count({
            where: { status: { in: ["PENDING", "FIRST_APPROVED"] }, organizationId },
        });
    },
    async getDepartmentScopedRequests(organizationId, departmentIds) {
        return prisma_1.prisma.disbursementRequest.findMany({
            where: { organizationId, departmentId: { in: departmentIds } },
            include: { lineItems: true, requestedBy: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" },
        });
    },
    async getVoucherData(id, organizationId) {
        const request = await prisma_1.prisma.disbursementRequest.findFirst({
            where: { id, organizationId },
            include: {
                requestedBy: { select: { name: true, email: true } },
                firstApprovedBy: { select: { name: true, email: true } },
                secondApprovedBy: { select: { name: true, email: true } },
                vendor: true,
                department: { select: { id: true, name: true } },
                lineItems: true,
            },
        });
        if (!request)
            return null;
        if (request.status !== "PAID") {
            throw new Error(`A payment voucher is only available for paid disbursements (current status: ${request.status})`);
        }
        const organization = await prisma_1.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true, address: true, phone: true, email: true, logoUrl: true, timezone: true, currency: true },
        });
        const paidAt = request.paidAt ?? request.updatedAt;
        // Derive the voucher number from the organization's timezone, not the
        // server's, so a payment made late in the evening is not dated to the
        // next day on the document.
        const organizationTimezone = organization?.timezone ?? date_1.DEFAULT_TIMEZONE;
        const voucherPeriod = new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "2-digit",
            timeZone: (0, date_1.isValidTimeZone)(organizationTimezone) ? organizationTimezone : date_1.DEFAULT_TIMEZONE,
        })
            .format(paidAt)
            .replace("-", "");
        const voucherNumber = `PV-${voucherPeriod}-${id.replace(/-/g, "").slice(-8).toUpperCase()}`;
        const payeeBankDetails = [];
        if (request.vendor?.bankName) {
            payeeBankDetails.push(`Bank: ${request.vendor.bankName}`);
        }
        if (request.vendor?.bankAccountName) {
            payeeBankDetails.push(`Account name: ${request.vendor.bankAccountName}`);
        }
        if (request.vendor?.bankAccountNumber) {
            payeeBankDetails.push(`Account number: ${request.vendor.bankAccountNumber}`);
        }
        if (request.vendor?.taxId) {
            payeeBankDetails.push(`Tax ID: ${request.vendor.taxId}`);
        }
        if (request.department) {
            payeeBankDetails.push(`Department: ${request.department.name}`);
        }
        return {
            voucherNumber,
            organizationName: organization?.name ?? "Organization",
            organizationAddress: organization?.address,
            organizationPhone: organization?.phone,
            organizationEmail: organization?.email,
            paidAt,
            purpose: request.purpose,
            payeeName: request.vendor?.name ?? request.department?.name ?? "Unassigned payee",
            payeeBankDetails,
            amountInKobo: request.amountInKobo,
            paymentMethod: request.paymentMethod ?? "Not recorded",
            paymentReference: request.paymentReference,
            paymentNotes: request.paymentNotes,
            requestedBy: request.requestedBy?.name ?? request.requestedBy?.email ?? "Unknown",
            firstApprovedBy: request.firstApprovedBy?.name ?? null,
            secondApprovedBy: request.secondApprovedBy?.name ?? null,
            // The controller overrides this with the user who actually released the
            // payment; this is the fallback chain when it cannot be resolved.
            paidBy: request.secondApprovedBy?.name ?? request.firstApprovedBy?.name ?? "Treasurer",
            lineItems: request.lineItems.map((li) => ({
                description: li.description,
                amountInKobo: li.amountInKobo,
            })),
            organizationLogoUrl: organization?.logoUrl ?? null,
            currency: (0, documentCurrency_1.normalizeCurrencyCode)(organization?.currency),
            timezone: organization?.timezone,
        };
    },
};
//# sourceMappingURL=disbursementService.js.map