"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const index_1 = require("../index");
const balanceService_1 = require("./balanceService");
const appError_1 = require("../utils/appError");
exports.ledgerService = {
    /**
     * Posts a ledger entry.
     *
     * The period row is locked FOR UPDATE before its lock flag is read, so a post
     * racing a period close either sees the closed period and is refused, or
     * completes before the close. The write itself is a SERIALIZABLE
     * transaction.
     */
    async createEntry(data) {
        const now = new Date();
        const fy = now.getFullYear();
        const month = now.getMonth() + 1;
        const entry = await prisma_1.prisma.$transaction(async (tx) => {
            const periodRows = await tx.$queryRaw `
          SELECT "isLocked" FROM "Period"
          WHERE "organizationId" = ${data.organizationId} AND "fiscalYear" = ${fy} AND "month" = ${month}
          FOR UPDATE
        `;
            if (periodRows[0]?.isLocked) {
                throw (0, appError_1.unprocessable)(`Period ${fy}-${String(month).padStart(2, "0")} is locked. Unlock it before posting new entries.`);
            }
            const fund = await tx.fund.findFirst({
                where: { id: data.fundId, organizationId: data.organizationId },
                select: { id: true },
            });
            if (!fund)
                throw new Error("Fund not found in organization");
            if (data.memberId) {
                const member = await tx.member.findFirst({
                    where: { id: data.memberId, organizationId: data.organizationId },
                    select: { id: true },
                });
                if (!member)
                    throw new Error("Member not found in organization");
            }
            return tx.ledgerEntry.create({ data });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
        (0, index_1.emitToOrganization)(data.organizationId, "ledger:created", { entry });
        return entry;
    },
    async listEntries(organizationId, fundId, startDate, endDate, page = 1, pageSize = 10) {
        const where = {
            organizationId,
            ...(fundId ? { fundId } : {}),
            ...(startDate || endDate
                ? { createdAt: { gte: startDate ? new Date(startDate) : undefined, lte: endDate ? new Date(endDate) : undefined } }
                : {}),
        };
        const [data, total] = await Promise.all([
            prisma_1.prisma.ledgerEntry.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { fund: { select: { id: true, name: true } } },
            }),
            prisma_1.prisma.ledgerEntry.count({ where }),
        ]);
        return { data, total };
    },
    async getEntry(id, organizationId) {
        return prisma_1.prisma.ledgerEntry.findFirst({ where: { id, organizationId } });
    },
    /**
     * Reversal of a ledger entry runs in a SERIALIZABLE transaction with the
     * original row locked FOR UPDATE and linked with a conditional update, so
     * two concurrent reversals of the same entry cannot both succeed.
     */
    async reverseEntry(id, reversalReason, reversedById, organizationId) {
        return prisma_1.prisma.$transaction(async (tx) => {
            const locked = await tx.$queryRaw `
          SELECT "id", "fundId", "type", "amountInKobo"::text AS "amountInKobo", "description", "reversedById"
          FROM "LedgerEntry"
          WHERE "id" = ${id} AND "organizationId" = ${organizationId}
          FOR UPDATE
        `;
            const entry = locked[0];
            if (!entry)
                throw (0, appError_1.unprocessable)("Ledger entry not found");
            if (entry.reversedById) {
                throw (0, appError_1.conflict)("This ledger entry has already been reversed", "LEDGER_ALREADY_REVERSED");
            }
            if (entry.type === "REVERSAL") {
                throw (0, appError_1.unprocessable)("Cannot reverse a reversal entry");
            }
            const reversal = await tx.ledgerEntry.create({
                data: {
                    organizationId,
                    fundId: entry.fundId,
                    type: "REVERSAL",
                    amountInKobo: -BigInt(entry.amountInKobo),
                    description: `REVERSED: ${entry.description} — ${reversalReason}`,
                    recordedById: reversedById,
                },
            });
            const linked = await tx.ledgerEntry.updateMany({
                where: { id, organizationId, reversedById: null },
                data: { reversedById: reversal.id },
            });
            if (linked.count !== 1) {
                throw (0, appError_1.conflict)("This ledger entry has already been reversed", "LEDGER_ALREADY_REVERSED");
            }
            await tx.auditLog.create({
                data: {
                    organizationId,
                    userId: reversedById,
                    action: "LEDGER_REVERSE",
                    details: { originalEntryId: id, reversalEntryId: reversal.id, reversalReason },
                },
            });
            return { original: { id, fundId: entry.fundId, description: entry.description, reversedById: reversal.id }, reversal };
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
    },
    async getFundBalance(fundId, organizationId) {
        const balances = await (0, balanceService_1.computeFundBalances)(organizationId, [fundId]);
        return balances.get(fundId)?.balanceInKobo ?? BigInt(0);
    },
};
//# sourceMappingURL=ledgerService.js.map