"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalService = void 0;
const prisma_1 = require("../lib/prisma");
const index_1 = require("../index");
exports.journalService = {
    async createEntry(input) {
        if (!input.lines || input.lines.length < 2) {
            throw new Error("A journal entry must have at least two lines");
        }
        let totalDebit = BigInt(0);
        let totalCredit = BigInt(0);
        for (const line of input.lines) {
            if (line.debitInKobo < BigInt(0) || line.creditInKobo < BigInt(0)) {
                throw new Error("Debit and credit amounts must be non-negative");
            }
            if (line.debitInKobo > BigInt(0) && line.creditInKobo > BigInt(0)) {
                throw new Error("A line cannot have both a debit and a credit");
            }
            if (line.debitInKobo === BigInt(0) && line.creditInKobo === BigInt(0)) {
                throw new Error("A line must have either a debit or a credit");
            }
            totalDebit += line.debitInKobo;
            totalCredit += line.creditInKobo;
        }
        if (totalDebit !== totalCredit) {
            throw new Error(`Journal entry is unbalanced: debits=${totalDebit.toString()} kobo, credits=${totalCredit.toString()} kobo`);
        }
        const accountIds = new Set(input.lines.map((l) => l.accountId));
        const accounts = await prisma_1.prisma.chartOfAccounts.findMany({
            where: { id: { in: Array.from(accountIds) }, organizationId: input.organizationId },
        });
        if (accounts.length !== accountIds.size) {
            throw new Error("One or more accounts do not exist in this organization");
        }
        const entry = await prisma_1.prisma.journalEntry.create({
            data: {
                organizationId: input.organizationId,
                description: input.description,
                reference: input.reference,
                createdById: input.createdById,
                date: input.date ?? new Date(),
                status: "POSTED",
                lines: {
                    create: input.lines.map((l) => ({
                        accountId: l.accountId,
                        description: l.description,
                        debitInKobo: l.debitInKobo,
                        creditInKobo: l.creditInKobo,
                    })),
                },
            },
            include: { lines: { include: { account: true } } },
        });
        (0, index_1.emitToOrganization)(input.organizationId, "journal:created", { entry });
        return entry;
    },
    async listEntries(organizationId, page = 1, pageSize = 10) {
        const [data, total] = await Promise.all([
            prisma_1.prisma.journalEntry.findMany({
                where: { organizationId },
                orderBy: { date: "desc" },
                include: { lines: { include: { account: true } } },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.journalEntry.count({ where: { organizationId } }),
        ]);
        return { data, total };
    },
    async reverseEntry(id, reversedById, organizationId, reason) {
        const original = await prisma_1.prisma.journalEntry.findFirst({
            where: { id, organizationId },
            include: { lines: true },
        });
        if (!original)
            throw new Error("Journal entry not found");
        if (original.status === "REVERSED") {
            throw new Error("This journal entry has already been reversed");
        }
        if (original.lines.length === 0) {
            throw new Error("Cannot reverse a journal entry with no lines");
        }
        const reversed = await this.createEntry({
            organizationId,
            description: `REVERSAL of ${id}: ${reason}`,
            reference: original.reference ? `REV-${original.reference}` : undefined,
            createdById: reversedById,
            date: new Date(),
            lines: original.lines.map((l) => ({
                accountId: l.accountId,
                description: l.description ?? undefined,
                debitInKobo: l.creditInKobo,
                creditInKobo: l.debitInKobo,
            })),
        });
        await prisma_1.prisma.journalEntry.update({
            where: { id },
            data: { status: "REVERSED" },
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                organizationId,
                userId: reversedById,
                action: "JOURNAL_REVERSE",
                details: { originalJournalId: id, reversalJournalId: reversed.id, reason },
            },
        });
        return reversed;
    },
    async getTrialBalance(organizationId, startDate, endDate, fundIds) {
        const where = {
            journalEntry: {
                organizationId,
                status: "POSTED",
                ...(startDate || endDate ? { date: { gte: startDate, lte: endDate } } : {}),
                // An empty `fundIds` is a real restriction, not "no restriction".
                ...(fundIds === undefined
                    ? {}
                    : { ledgerEntries: { some: { fundId: { in: fundIds } } } }),
            },
        };
        const grouped = await prisma_1.prisma.journalLine.groupBy({
            by: ["accountId"],
            where,
            _sum: { debitInKobo: true, creditInKobo: true },
        });
        if (grouped.length === 0)
            return { lines: [], totals: { debit: "0", credit: "0" } };
        const accounts = await prisma_1.prisma.chartOfAccounts.findMany({
            where: { id: { in: grouped.map((g) => g.accountId) } },
        });
        const accountMap = new Map(accounts.map((a) => [a.id, a]));
        let totalDebit = BigInt(0);
        let totalCredit = BigInt(0);
        const lines = grouped.map((g) => {
            const debit = g._sum.debitInKobo ?? BigInt(0);
            const credit = g._sum.creditInKobo ?? BigInt(0);
            totalDebit += debit;
            totalCredit += credit;
            const account = accountMap.get(g.accountId);
            return {
                accountId: g.accountId,
                accountCode: account?.code,
                accountName: account?.name,
                accountType: account?.type,
                debitInKobo: debit.toString(),
                creditInKobo: credit.toString(),
                balance: (debit - credit).toString(),
            };
        });
        return {
            lines: lines.sort((a, b) => (a.accountCode || "").localeCompare(b.accountCode || "")),
            totals: { debit: totalDebit.toString(), credit: totalCredit.toString() },
        };
    },
};
//# sourceMappingURL=journalService.js.map