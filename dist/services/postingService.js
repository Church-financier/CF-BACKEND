"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postContributionJournalEntry = postContributionJournalEntry;
exports.postDisbursementJournalEntry = postDisbursementJournalEntry;
const prisma_1 = require("../lib/prisma");
const journalService_1 = require("./journalService");
const index_1 = require("../index");
async function findAccountByType(organizationId, type) {
    const account = await prisma_1.prisma.chartOfAccounts.findFirst({
        where: { organizationId, type, isActive: true },
        orderBy: { code: "asc" },
        select: { id: true },
    });
    return account?.id ?? null;
}
async function postContributionJournalEntry(params) {
    const [cashAccountId, incomeAccountId] = await Promise.all([
        findAccountByType(params.organizationId, "ASSET"),
        findAccountByType(params.organizationId, "INCOME"),
    ]);
    if (!cashAccountId || !incomeAccountId)
        return;
    const lines = [
        { accountId: cashAccountId, description: params.description, debitInKobo: params.amountInKobo, creditInKobo: BigInt(0) },
        { accountId: incomeAccountId, description: params.description, debitInKobo: BigInt(0), creditInKobo: params.amountInKobo },
    ];
    const entry = await journalService_1.journalService.createEntry({
        organizationId: params.organizationId,
        date: params.date ?? new Date(),
        description: `Contribution: ${params.description}`,
        reference: params.fundId,
        createdById: params.createdById,
        lines,
    });
    await prisma_1.prisma.ledgerEntry.update({
        where: { id: params.ledgerEntryId },
        data: { journalId: entry.id },
    });
    (0, index_1.emitToOrganization)(params.organizationId, "journal:posted", { entry });
}
async function postDisbursementJournalEntry(params) {
    const [expenseAccountId, cashAccountId] = await Promise.all([
        findAccountByType(params.organizationId, "EXPENSE"),
        findAccountByType(params.organizationId, "ASSET"),
    ]);
    if (!expenseAccountId || !cashAccountId)
        return;
    const lines = [
        { accountId: expenseAccountId, description: params.description, debitInKobo: params.amountInKobo, creditInKobo: BigInt(0) },
        { accountId: cashAccountId, description: params.description, debitInKobo: BigInt(0), creditInKobo: params.amountInKobo },
    ];
    const entry = await journalService_1.journalService.createEntry({
        organizationId: params.organizationId,
        date: params.date ?? new Date(),
        description: `Disbursement: ${params.description}`,
        createdById: params.createdById,
        lines,
    });
    (0, index_1.emitToOrganization)(params.organizationId, "journal:posted", { entry });
}
//# sourceMappingURL=postingService.js.map