"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalController = exports.getTrialBalance = exports.reverseJournalEntry = exports.listJournalEntries = exports.createJournalEntry = void 0;
const journalService_1 = require("../services/journalService");
const pagination_1 = require("../utils/pagination");
const createJournalEntry = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const lines = body.lines.map((l) => ({
        accountId: l.accountId,
        description: l.description,
        debitInKobo: BigInt(l.debitInKobo),
        creditInKobo: BigInt(l.creditInKobo),
    }));
    const entry = await journalService_1.journalService.createEntry({
        organizationId: user.organizationId,
        description: body.description,
        reference: body.reference,
        date: body.date ? new Date(body.date) : undefined,
        createdById: user.id,
        lines,
    });
    return res.status(201).json(entry);
};
exports.createJournalEntry = createJournalEntry;
const listJournalEntries = async (req, res) => {
    const user = req.user;
    const params = (0, pagination_1.parsePagination)(req);
    const result = await journalService_1.journalService.listEntries(user.organizationId, params.page, params.pageSize);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listJournalEntries = listJournalEntries;
const reverseJournalEntry = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const entry = await journalService_1.journalService.reverseEntry(req.params.id, user.id, user.organizationId, body.reason);
    return res.status(200).json(entry);
};
exports.reverseJournalEntry = reverseJournalEntry;
const getTrialBalance = async (req, res) => {
    const user = req.user;
    const { startDate, endDate } = req.query;
    const result = await journalService_1.journalService.getTrialBalance(user.organizationId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    return res.status(200).json(result);
};
exports.getTrialBalance = getTrialBalance;
exports.journalController = {
    createJournalEntry: exports.createJournalEntry,
    listJournalEntries: exports.listJournalEntries,
    reverseJournalEntry: exports.reverseJournalEntry,
    getTrialBalance: exports.getTrialBalance,
};
//# sourceMappingURL=journalController.js.map