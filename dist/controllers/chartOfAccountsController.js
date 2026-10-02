"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartOfAccountsController = exports.deleteAccount = exports.updateAccount = exports.createAccount = exports.getAccount = exports.listAccounts = void 0;
const chartOfAccountsService_1 = require("../services/chartOfAccountsService");
const pagination_1 = require("../utils/pagination");
const listAccounts = async (req, res) => {
    const user = req.user;
    const params = (0, pagination_1.parsePagination)(req);
    const result = await chartOfAccountsService_1.chartOfAccountsService.list(params.page, params.pageSize, user.organizationId);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listAccounts = listAccounts;
const getAccount = async (req, res) => {
    const user = req.user;
    const account = await chartOfAccountsService_1.chartOfAccountsService.getById(req.params.id, user.organizationId);
    if (!account) {
        return res.status(404).json({ error: "Account not found" });
    }
    return res.status(200).json(account);
};
exports.getAccount = getAccount;
const createAccount = async (req, res) => {
    const user = req.user;
    try {
        const account = await chartOfAccountsService_1.chartOfAccountsService.create({ ...req.body, organizationId: user.organizationId });
        return res.status(201).json(account);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create account';
        if (message.startsWith("Parent account code") && message.endsWith("not found")) {
            return res.status(400).json({ error: message });
        }
        return res.status(500).json({ error: message });
    }
};
exports.createAccount = createAccount;
const updateAccount = async (req, res) => {
    const user = req.user;
    const account = await chartOfAccountsService_1.chartOfAccountsService.update(req.params.id, req.body, user.organizationId);
    return res.status(200).json(account);
};
exports.updateAccount = updateAccount;
const deleteAccount = async (req, res) => {
    const user = req.user;
    await chartOfAccountsService_1.chartOfAccountsService.delete(req.params.id, user.organizationId);
    return res.status(204).send();
};
exports.deleteAccount = deleteAccount;
exports.chartOfAccountsController = { listAccounts: exports.listAccounts, getAccount: exports.getAccount, createAccount: exports.createAccount, updateAccount: exports.updateAccount, deleteAccount: exports.deleteAccount };
//# sourceMappingURL=chartOfAccountsController.js.map