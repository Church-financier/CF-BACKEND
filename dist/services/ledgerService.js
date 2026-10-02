"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerService = void 0;
const prisma_1 = require("../lib/prisma");
const index_1 = require("../index");
const balanceService_1 = require("./balanceService");
exports.ledgerService = {
    async createEntry(data) {
        const now = new Date();
        const fy = now.getFullYear();
        const month = now.getMonth() + 1;
        const locked = await prisma_1.prisma.period.findUnique({
            where: { organizationId_fiscalYear_month: { organizationId: data.organizationId, fiscalYear: fy, month } },
        });
        if (locked?.isLocked) {
            throw new Error(`Period ${fy}-${String(month).padStart(2, "0")} is locked. Unlock it before posting new entries.`);
        }
        const fund = await prisma_1.prisma.fund.findFirst({
            where: { id: data.fundId, organizationId: data.organizationId },
            select: { id: true },
        });
        if (!fund)
            throw new Error("Fund not found in organization");
        if (data.memberId) {
            const member = await prisma_1.prisma.member.findFirst({
                where: { id: data.memberId, organizationId: data.organizationId },
                select: { id: true },
            });
            if (!member)
                throw new Error("Member not found in organization");
        }
        const entry = await prisma_1.prisma.ledgerEntry.create({ data });
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
    async reverseEntry(id, reversalReason, reversedById, organizationId) {
        const entry = await prisma_1.prisma.ledgerEntry.findFirst({ where: { id, organizationId } });
        if (!entry)
            throw new Error("Ledger entry not found");
        if (entry.reversedById) {
            throw new Error("This ledger entry has already been reversed");
        }
        if (entry.type === "REVERSAL") {
            throw new Error("Cannot reverse a reversal entry");
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const reversal = await tx.ledgerEntry.create({
                data: {
                    organizationId,
                    fundId: entry.fundId,
                    type: "REVERSAL",
                    amountInKobo: -entry.amountInKobo,
                    description: `REVERSED: ${entry.description} — ${reversalReason}`,
                    recordedById: reversedById,
                },
            });
            await tx.ledgerEntry.update({
                where: { id: entry.id },
                data: { reversedById: reversal.id },
            });
            await tx.auditLog.create({
                data: {
                    organizationId,
                    userId: reversedById,
                    action: "LEDGER_REVERSE",
                    details: { originalEntryId: id, reversalEntryId: reversal.id, reversalReason },
                },
            });
            return { original: { ...entry, reversedById: reversal.id }, reversal };
        });
    },
    async getFundBalance(fundId, organizationId) {
        const balances = await (0, balanceService_1.computeFundBalances)(organizationId, [fundId]);
        return balances.get(fundId)?.balanceInKobo ?? BigInt(0);
    },
};
//# sourceMappingURL=ledgerService.js.map