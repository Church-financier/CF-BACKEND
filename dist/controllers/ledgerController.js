"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerController = exports.reverseLedgerEntry = exports.getLedgerEntry = exports.listLedgerEntries = exports.createLedgerEntry = void 0;
const ledgerService_1 = require("../services/ledgerService");
const pagination_1 = require("../utils/pagination");
const createLedgerEntry = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const entry = await ledgerService_1.ledgerService.createEntry({
        amountInKobo: BigInt(body.amountInKobo),
        type: body.type,
        fundId: body.fundId,
        description: body.description,
        recordedById: user.id,
        organizationId: user.organizationId,
        memberId: body.memberId,
    });
    return res.status(201).json(entry);
};
exports.createLedgerEntry = createLedgerEntry;
const listLedgerEntries = async (req, res) => {
    const user = req.user;
    const { fundId, startDate, endDate } = req.query;
    const params = (0, pagination_1.parsePagination)(req);
    const result = await ledgerService_1.ledgerService.listEntries(user.organizationId, fundId, startDate, endDate, params.page, params.pageSize);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listLedgerEntries = listLedgerEntries;
const getLedgerEntry = async (req, res) => {
    const user = req.user;
    const entry = await ledgerService_1.ledgerService.getEntry(req.params.id, user.organizationId);
    if (!entry) {
        return res.status(404).json({ error: "Ledger entry not found" });
    }
    return res.status(200).json(entry);
};
exports.getLedgerEntry = getLedgerEntry;
const reverseLedgerEntry = async (req, res) => {
    const user = req.user;
    const body = req.body;
    const result = await ledgerService_1.ledgerService.reverseEntry(req.params.id, body.reversalReason, user.id, user.organizationId);
    return res.status(200).json(result);
};
exports.reverseLedgerEntry = reverseLedgerEntry;
exports.ledgerController = {
    createLedgerEntry: exports.createLedgerEntry,
    listLedgerEntries: exports.listLedgerEntries,
    getLedgerEntry: exports.getLedgerEntry,
    reverseLedgerEntry: exports.reverseLedgerEntry,
};
//# sourceMappingURL=ledgerController.js.map