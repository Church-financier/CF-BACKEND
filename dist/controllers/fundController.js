"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundController = exports.deleteFund = exports.updateFund = exports.getFund = exports.listFunds = exports.createFund = void 0;
const fundService_1 = require("../services/fundService");
const pagination_1 = require("../utils/pagination");
const createFund = async (req, res) => {
    const user = req.user;
    const fund = await fundService_1.fundService.create({ ...req.body, organizationId: user.organizationId });
    return res.status(201).json(fund);
};
exports.createFund = createFund;
const listFunds = async (req, res) => {
    const user = req.user;
    const params = (0, pagination_1.parsePagination)(req);
    const result = await fundService_1.fundService.list(params.page, params.pageSize, user.organizationId);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listFunds = listFunds;
const getFund = async (req, res) => {
    const user = req.user;
    const fund = await fundService_1.fundService.getById(req.params.id, user.organizationId);
    if (!fund) {
        return res.status(404).json({ error: "Fund not found" });
    }
    return res.status(200).json(fund);
};
exports.getFund = getFund;
const updateFund = async (req, res) => {
    const user = req.user;
    const fund = await fundService_1.fundService.update(req.params.id, req.body, user.organizationId);
    return res.status(200).json(fund);
};
exports.updateFund = updateFund;
const deleteFund = async (req, res) => {
    const user = req.user;
    await fundService_1.fundService.delete(req.params.id, user.organizationId);
    return res.status(204).send();
};
exports.deleteFund = deleteFund;
exports.fundController = { createFund: exports.createFund, listFunds: exports.listFunds, getFund: exports.getFund, updateFund: exports.updateFund, deleteFund: exports.deleteFund };
//# sourceMappingURL=fundController.js.map