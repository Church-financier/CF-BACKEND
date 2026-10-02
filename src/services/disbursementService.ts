import { prisma } from "../lib/prisma";
import { emitToOrganization } from "../index";
import { Prisma, Role, type DisbursementStatus } from "@prisma/client";
import { postDisbursementJournalEntry } from "./postingService";
import type { PrismaLike } from "./journalService";
import { conflict, unprocessable } from "../utils/appError";
import {
  canTransitionDisbursement,
  isTerminalDisbursementStatus,
} from "../utils/disbursementState";
import { DEFAULT_TIMEZONE, isValidTimeZone } from "../utils/date";
import { normalizeCurrencyCode } from "../utils/documentCurrency";

export interface CreateDisbursementInput {
  amountInKobo: bigint;
  purpose: string;
  requestedById: string;
  vendorId?: string;
  departmentId?: string;
  organizationId: string;
  lineItems?: Array<{
    description: string;
    amountInKobo: bigint;
    receiptUrl?: string;
  }>;
}

const APPROVAL_THRESHOLD_KOBO = BigInt(0);
const APPROVER_ROLES: Role[] = [Role.SUPER_ADMIN, Role.TREASURER];

/**
 * Disbursement state machine.
 *
 * PAID, REJECTED and CANCELLED are terminal for their own action: a paid
 * requisition cannot be approved or rejected again, and a rejected or
 * cancelled one can only be read. This is what stops a retried click from
 * paying the same requisition twice.
 */
function assertTransition(from: string, to: string) {
  if (!canTransitionDisbursement(from, to)) {
    if (isTerminalDisbursementStatus(from)) {
      throw conflict(
        `This disbursement is already ${from} and cannot be changed to ${to}.`,
        "DISBURSEMENT_TERMINAL",
      );
    }
    throw conflict(
      `A disbursement cannot move from ${from} to ${to}.`,
      "DISBURSEMENT_INVALID_TRANSITION",
    );
  }
}

/** Row shape returned by the pessimistic lock below. */
interface LockedDisbursement {
  id: string;
  status: string;
  amountInKobo: string;
  purpose: string;
  requestedById: string;
  firstApprovedById: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paidAt: Date | null;
}

/**
 * Locks the disbursement row FOR UPDATE inside the caller's transaction.
 *
 * Every status-changing routine reads the row through this lock, so two
 * concurrent clicks serialise: the second one sees the committed status and
 * fails the state guard instead of paying again.
 */
async function lockDisbursementForUpdate(
  tx: PrismaLike,
  id: string,
  organizationId: string,
): Promise<LockedDisbursement> {
  const rows = await tx.$queryRaw<LockedDisbursement[]>`
    SELECT "id", "status", "amountInKobo"::text AS "amountInKobo", "purpose",
           "requestedById", "firstApprovedById", "paymentMethod", "paymentReference", "paidAt"
    FROM "DisbursementRequest"
    WHERE "id" = ${id} AND "organizationId" = ${organizationId}
    FOR UPDATE
  `;

  if (rows.length === 0) {
    throw unprocessable("Disbursement request not found");
  }
  return rows[0];
}

async function assertApprover(approverId: string, organizationId: string, action = "approve disbursement requests") {
  const approver = await prisma.user.findFirst({
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

export const disbursementService = {
  canTransition: canTransitionDisbursement,
  isTerminal: isTerminalDisbursementStatus,

  async createRequest(data: CreateDisbursementInput) {
    const { lineItems, ...rest } = data;

    if (lineItems && lineItems.length > 0) {
      const itemsTotal = lineItems.reduce<bigint>(
        (sum, item) => sum + BigInt(item.amountInKobo),
        BigInt(0)
      );
      if (itemsTotal !== BigInt(rest.amountInKobo)) {
        throw new Error(
          `Line items total (${itemsTotal.toString()} kobo) does not match disbursement amount (${rest.amountInKobo.toString()} kobo)`
        );
      }
    }

    if (rest.vendorId) {
      const vendor = await prisma.vendor.findFirst({
        where: { id: rest.vendorId, organizationId: rest.organizationId },
        select: { id: true },
      });
      if (!vendor) throw new Error("Vendor not found in organization");
    }

    if (rest.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: rest.departmentId, organizationId: rest.organizationId },
        select: { id: true },
      });
      if (!department) throw new Error("Department not found in organization");
    }

    const requester = await prisma.user.findUnique({
      where: { id: rest.requestedById },
      select: { role: true },
    });

    const isElevatedInitiator =
      requester && APPROVER_ROLES.includes(requester.role) && !rest.departmentId;

    const createData: any = {
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

    const request = await prisma.disbursementRequest.create({
      data: createData,
      include: { lineItems: true },
    });

    if (isElevatedInitiator) {
      emitToOrganization(data.organizationId, "disbursement:first_approved", { request });
    } else {
      emitToOrganization(data.organizationId, "disbursement:approval_requested", { request });
    }
    return request;
  },

  async listRequests(
    organizationId: string,
    status?: string,
    page = 1,
    pageSize = 10,
    scopedDepartmentIds?: string[],
    departmentId?: string
  ) {
    const where: Prisma.DisbursementRequestWhereInput = { organizationId };
    if (status) where.status = status as any;
    if (scopedDepartmentIds) where.departmentId = { in: scopedDepartmentIds };
    if (departmentId) where.departmentId = departmentId;
    const [data, total] = await Promise.all([
      prisma.disbursementRequest.findMany({
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
      prisma.disbursementRequest.count({ where }),
    ]);
    return { data, total };
  },

  async getRequestById(id: string, organizationId: string) {
    return prisma.disbursementRequest.findFirst({
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

  async firstApprove(id: string, approverId: string, organizationId: string) {
    await assertApprover(approverId, organizationId);

    const updated = await prisma.$transaction(
      async (tx) => {
        const txClient = tx as unknown as PrismaLike;
        const locked = await lockDisbursementForUpdate(txClient, id, organizationId);
        assertTransition(locked.status, "FIRST_APPROVED");

        const approver = await tx.user.findUnique({
          where: { id: approverId },
          select: { role: true },
        });
        const isElevatedRole = approver?.role === "SUPER_ADMIN" || approver?.role === "TREASURER";

        if (locked.requestedById === approverId && !isElevatedRole) {
          throw unprocessable("You cannot approve your own disbursement request");
        }

        // Atomic state guard: the update only lands while the row is still in
        // the expected status, so a second concurrent click affects no rows.
        const flipped = await tx.disbursementRequest.updateMany({
          where: { id, organizationId, status: "PENDING" },
          data: { status: "FIRST_APPROVED", firstApprovedById: approverId },
        });
        if (flipped.count !== 1) {
          throw conflict(
            "This disbursement was already actioned by another request.",
            "DISBURSEMENT_CONCURRENT_UPDATE",
          );
        }

        return tx.disbursementRequest.findUnique({
          where: { id },
          include: {
            lineItems: true,
            firstApprovedBy: { select: { name: true, email: true } },
            secondApprovedBy: { select: { name: true, email: true } },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 },
    );

    emitToOrganization(organizationId, "disbursement:first_approved", { request: updated });
    return updated;
  },

  async secondApprove(id: string, approverId: string, organizationId: string) {
    await assertApprover(approverId, organizationId);

    const updated = await prisma.$transaction(
      async (tx) => {
        const txClient = tx as unknown as PrismaLike;
        const locked = await lockDisbursementForUpdate(txClient, id, organizationId);
        assertTransition(locked.status, "APPROVED");

        const approver = await tx.user.findUnique({
          where: { id: approverId },
          select: { role: true },
        });
        const isElevatedRole = approver?.role === "SUPER_ADMIN" || approver?.role === "TREASURER";

        if (locked.requestedById === approverId && !isElevatedRole) {
          throw unprocessable("You cannot approve your own disbursement request");
        }
        // Dual control: the two approval stages must be different people. The
        // one exception is a requisition an elevated role raised itself, which
        // is first-approved automatically at creation time.
        const autoFirstApproved = locked.firstApprovedById === locked.requestedById;
        if (locked.firstApprovedById === approverId && !autoFirstApproved) {
          throw unprocessable("The first approver cannot also be the second approver");
        }

        const flipped = await tx.disbursementRequest.updateMany({
          where: { id, organizationId, status: "FIRST_APPROVED" },
          data: { status: "APPROVED", secondApprovedById: approverId, approvedById: approverId },
        });
        if (flipped.count !== 1) {
          throw conflict(
            "This disbursement was already actioned by another request.",
            "DISBURSEMENT_CONCURRENT_UPDATE",
          );
        }

        return tx.disbursementRequest.findUnique({
          where: { id },
          include: {
            lineItems: true,
            firstApprovedBy: { select: { name: true, email: true } },
            secondApprovedBy: { select: { name: true, email: true } },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 },
    );

    emitToOrganization(organizationId, "disbursement:approved", { request: updated });
    return updated;
  },

  async rejectRequest(id: string, rejectedById: string, organizationId: string, reason?: string) {
    const updated = await prisma.$transaction(
      async (tx) => {
        const txClient = tx as unknown as PrismaLike;
        const locked = await lockDisbursementForUpdate(txClient, id, organizationId);
        assertTransition(locked.status, "REJECTED");

        const flipped = await tx.disbursementRequest.updateMany({
          where: { id, organizationId, status: locked.status as DisbursementStatus },
          data: {
            status: "REJECTED",
            approvedById: rejectedById,
            ...(reason ? { paymentNotes: `REJECTED: ${reason}` } : {}),
          },
        });
        if (flipped.count !== 1) {
          throw conflict(
            "This disbursement was already actioned by another request.",
            "DISBURSEMENT_CONCURRENT_UPDATE",
          );
        }

        return tx.disbursementRequest.findUnique({ where: { id }, include: { lineItems: true } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 },
    );

    emitToOrganization(organizationId, "disbursement:rejected", { request: updated });
    return updated;
  },

  /**
   * Releases a payment.
   *
   * The status change, the audit trail and the expense journal entry are one
   * SERIALIZABLE transaction guarded by a row lock and a conditional update,
   * so a double-clicked "Mark as paid" can produce exactly one payment and one
   * set of ledger lines — or fail cleanly with a conflict.
   */
  async markPaid(
    id: string,
    payerId: string,
    organizationId: string,
    paymentData: { paymentMethod: string; paymentReference?: string; paymentNotes?: string }
  ) {
    await assertApprover(payerId, organizationId, "release disbursement payouts");

    const updated = await prisma.$transaction(
      async (tx) => {
        const txClient = tx as unknown as PrismaLike;
        const locked = await lockDisbursementForUpdate(txClient, id, organizationId);
        assertTransition(locked.status, "PAID");

        const paidAt = new Date();
        const flipped = await tx.disbursementRequest.updateMany({
          where: { id, organizationId, status: "APPROVED" },
          data: {
            status: "PAID",
            paidAt,
            paymentMethod: paymentData.paymentMethod,
            paymentReference: paymentData.paymentReference,
            paymentNotes: paymentData.paymentNotes,
          },
        });
        if (flipped.count !== 1) {
          throw conflict(
            "This disbursement was already paid or actioned by another request.",
            "DISBURSEMENT_CONCURRENT_UPDATE",
          );
        }

        await tx.auditLog.create({
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

        const request = await tx.disbursementRequest.findUnique({
          where: { id },
          include: { lineItems: true },
        });
        if (!request) throw unprocessable("Disbursement request not found");

        // The expense double entry belongs to the same transaction: if the
        // posting fails the payment is rolled back rather than left unposted.
        await postDisbursementJournalEntry({
          tx: txClient,
          organizationId,
          createdById: payerId,
          amountInKobo: request.amountInKobo,
          description: request.purpose,
          date: request.paidAt ?? paidAt,
        });

        return request;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 },
    );

    emitToOrganization(organizationId, "disbursement:paid", { request: updated });
    return updated;
  },

  async cancelDisbursement(
    id: string,
    cancelledById: string,
    organizationId: string,
    reason: string
  ) {
    await assertApprover(cancelledById, organizationId, "cancel disbursements");

    const outcome = await prisma.$transaction(
      async (tx) => {
        const txClient = tx as unknown as PrismaLike;
        const locked = await lockDisbursementForUpdate(txClient, id, organizationId);
        assertTransition(locked.status, "CANCELLED");
        const wasPaid = locked.status === "PAID";

        const flipped = await tx.disbursementRequest.updateMany({
          where: { id, organizationId, status: locked.status as DisbursementStatus },
          data: {
            status: "CANCELLED",
            approvedById: cancelledById,
            ...(reason ? { paymentNotes: `CANCELLED: ${reason}` } : {}),
          },
        });
        if (flipped.count !== 1) {
          throw conflict(
            "This disbursement was already actioned by another request.",
            "DISBURSEMENT_CONCURRENT_UPDATE",
          );
        }

        const request = await tx.disbursementRequest.findUnique({
          where: { id },
          include: { lineItems: true },
        });
        if (!request) throw unprocessable("Disbursement request not found");

        // A paid disbursement is only cancellable as a storno, which reverses
        // the original expense entry inside this same transaction.
        if (wasPaid) {
          await tx.auditLog.create({
            data: {
              organizationId,
              userId: cancelledById,
              action: "DISBURSEMENT_CANCELLED_AFTER_PAID",
              details: {
                disbursementId: id,
                reason,
                originalPaymentMethod: locked.paymentMethod,
                originalPaymentReference: locked.paymentReference,
              },
            },
          });

          await postDisbursementJournalEntry({
            tx: txClient,
            organizationId,
            createdById: cancelledById,
            amountInKobo: -request.amountInKobo,
            description: `REVERSAL: ${request.purpose}`,
            date: new Date(),
          });
        } else {
          await tx.auditLog.create({
            data: {
              organizationId,
              userId: cancelledById,
              action: "DISBURSEMENT_CANCELLED",
              details: { disbursementId: id, reason },
            },
          });
        }

        return { request, wasPaid };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 },
    );

    emitToOrganization(organizationId, "disbursement:cancelled", { request: outcome.request });
    return outcome.request;
  },

  async getPendingCount(organizationId: string) {
    return prisma.disbursementRequest.count({
      where: { status: { in: ["PENDING", "FIRST_APPROVED"] }, organizationId },
    });
  },

  async getDepartmentScopedRequests(organizationId: string, departmentIds: string[]) {
    return prisma.disbursementRequest.findMany({
      where: { organizationId, departmentId: { in: departmentIds } },
      include: { lineItems: true, requestedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async getVoucherData(id: string, organizationId: string) {
    const request = await prisma.disbursementRequest.findFirst({
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

    if (!request) return null;
    if (request.status !== "PAID") {
      throw new Error(
        `A payment voucher is only available for paid disbursements (current status: ${request.status})`
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, address: true, phone: true, email: true, logoUrl: true, timezone: true, currency: true },
    });

    const paidAt = request.paidAt ?? request.updatedAt;
    // Derive the voucher number from the organization's timezone, not the
    // server's, so a payment made late in the evening is not dated to the
    // next day on the document.
    const organizationTimezone = organization?.timezone ?? DEFAULT_TIMEZONE;
    const voucherPeriod = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      timeZone: isValidTimeZone(organizationTimezone) ? organizationTimezone : DEFAULT_TIMEZONE,
    })
      .format(paidAt)
      .replace("-", "");
    const voucherNumber = `PV-${voucherPeriod}-${id.replace(/-/g, "").slice(-8).toUpperCase()}`;

    const payeeBankDetails: string[] = [];
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
      currency: normalizeCurrencyCode(organization?.currency),
      timezone: organization?.timezone,
    };
  },
};
