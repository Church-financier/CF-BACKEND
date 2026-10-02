"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetPeriodController = exports.deleteBudgetPeriod = exports.approveAndLockBudgetPeriod = exports.closeBudgetSubmission = exports.openBudgetSubmission = exports.updateBudgetPeriod = exports.getActiveBudgetPeriod = exports.getBudgetPeriod = exports.listBudgetPeriods = exports.createBudgetPeriod = void 0;
const budgetPeriodService_1 = require("../services/budgetPeriodService");
const pagination_1 = require("../utils/pagination");
const createBudgetPeriod = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const period = await budgetPeriodService_1.budgetPeriodService.create({
            fiscalYear: body.fiscalYear,
            submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : undefined,
            organizationId: user.organizationId,
        });
        return res.status(201).json(period);
    }
    catch (err) {
        if (err?.code === "BUDGET_PERIOD_EXISTS") {
            return res.status(409).json({ error: err.message });
        }
        throw err;
    }
};
exports.createBudgetPeriod = createBudgetPeriod;
const listBudgetPeriods = async (req, res) => {
    const user = req.user;
    const params = (0, pagination_1.parsePagination)(req);
    const result = await budgetPeriodService_1.budgetPeriodService.list(params.page, params.pageSize, user.organizationId);
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listBudgetPeriods = listBudgetPeriods;
const getBudgetPeriod = async (req, res) => {
    const user = req.user;
    const period = await budgetPeriodService_1.budgetPeriodService.getById(req.params.id, user.organizationId);
    if (!period)
        return res.status(404).json({ error: "Budget period not found" });
    return res.status(200).json(period);
};
exports.getBudgetPeriod = getBudgetPeriod;
const getActiveBudgetPeriod = async (req, res) => {
    const user = req.user;
    const period = await budgetPeriodService_1.budgetPeriodService.getActive(user.organizationId);
    if (!period)
        return res.status(200).json(null);
    return res.status(200).json(period);
};
exports.getActiveBudgetPeriod = getActiveBudgetPeriod;
const updateBudgetPeriod = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const period = await budgetPeriodService_1.budgetPeriodService.update(req.params.id, user.organizationId, {
            fiscalYear: body.fiscalYear,
            status: body.status,
            submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : null,
        });
        if (!period)
            return res.status(404).json({ error: "Budget period not found" });
        return res.status(200).json(period);
    }
    catch (err) {
        if (err?.code === "BUDGET_PERIOD_EXISTS") {
            return res.status(409).json({ error: err.message });
        }
        if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        throw err;
    }
};
exports.updateBudgetPeriod = updateBudgetPeriod;
const openBudgetSubmission = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const period = await budgetPeriodService_1.budgetPeriodService.openSubmission(req.params.id, user.organizationId, new Date(body.submissionDeadline));
        return res.status(200).json(period);
    }
    catch (err) {
        if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_PERIOD_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.openBudgetSubmission = openBudgetSubmission;
const closeBudgetSubmission = async (req, res) => {
    const user = req.user;
    try {
        const period = await budgetPeriodService_1.budgetPeriodService.closeSubmission(req.params.id, user.organizationId);
        return res.status(200).json(period);
    }
    catch (err) {
        if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_PERIOD_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.closeBudgetSubmission = closeBudgetSubmission;
const approveAndLockBudgetPeriod = async (req, res) => {
    const user = req.user;
    try {
        const period = await budgetPeriodService_1.budgetPeriodService.approveAndLock(req.params.id, user.organizationId);
        return res.status(200).json(period);
    }
    catch (err) {
        if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "ALREADY_LOCKED") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.approveAndLockBudgetPeriod = approveAndLockBudgetPeriod;
const deleteBudgetPeriod = async (req, res) => {
    const user = req.user;
    try {
        const result = await budgetPeriodService_1.budgetPeriodService.delete(req.params.id, user.organizationId);
        if (result.count === 0)
            return res.status(404).json({ error: "Budget period not found" });
        return res.status(204).send();
    }
    catch (err) {
        if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "PERIOD_LOCKED") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.deleteBudgetPeriod = deleteBudgetPeriod;
exports.budgetPeriodController = {
    createBudgetPeriod: exports.createBudgetPeriod,
    listBudgetPeriods: exports.listBudgetPeriods,
    getBudgetPeriod: exports.getBudgetPeriod,
    getActiveBudgetPeriod: exports.getActiveBudgetPeriod,
    updateBudgetPeriod: exports.updateBudgetPeriod,
    openBudgetSubmission: exports.openBudgetSubmission,
    closeBudgetSubmission: exports.closeBudgetSubmission,
    approveAndLockBudgetPeriod: exports.approveAndLockBudgetPeriod,
    deleteBudgetPeriod: exports.deleteBudgetPeriod,
};
//# sourceMappingURL=budgetPeriodController.js.map