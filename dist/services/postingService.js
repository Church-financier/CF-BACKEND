"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postContributionJournalEntry = postContributionJournalEntry;
exports.postDisbursementJournalEntry = postDisbursementJournalEntry;
const prisma_1 = require("../lib/prisma");
const journalService_1 = require("./journalService");
const index_1 = require("../index");
async function findAccountByType(organizationId, type, client) {
    const tx = (client ?? prisma_1.prisma);
    const account = await tx.chartOfAccounts.findFirst({
        where: { organizationId, type, isActive: true },
        orderBy: { code: "asc" },
        select: { id: true },
    });
    return account?.id ?? null;
}
async function postContributionJournalEntry(params) {
    const tx = params.tx;
    const [cashAccountId, incomeAccountId] = await Promise.all([
        findAccountByType(params.organizationId, "ASSET", tx),
        findAccountByType(params.organizationId, "INCOME", tx),
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
    }, tx);
    // Inside a caller transaction the journal link must be written with the same
    // client; outside it, link and emit as before.
    if (tx) {
        await tx.ledgerEntry.update({
            where: { id: params.ledgerEntryId },
            data: { journalId: entry.id },
        });
    }
    else {
        await prisma_1.prisma.ledgerEntry.update({
            where: { id: params.ledgerEntryId },
            data: { journalId: entry.id },
        });
    }
    if (!tx) {
        (0, index_1.emitToOrganization)(params.organizationId, "journal:posted", { entry });
    }
}
async function postDisbursementJournalEntry(params) {
    const tx = params.tx;
    const [expenseAccountId, cashAccountId] = await Promise.all([
        findAccountByType(params.organizationId, "EXPENSE", tx),
        findAccountByType(params.organizationId, "ASSET", tx),
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
    }, tx);
    if (!tx) {
        (0, index_1.emitToOrganization)(params.organizationId, "journal:posted", { entry });
    }
}
//# sourceMappingURL=postingService.js.map