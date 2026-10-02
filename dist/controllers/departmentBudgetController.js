"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentBudgetController = exports.deleteDepartmentBudget = exports.rejectDepartmentBudget = exports.approveDepartmentBudget = exports.returnDepartmentBudgetForRevision = exports.submitDepartmentBudget = exports.updateDepartmentBudget = exports.listDepartmentBudgetsByPeriod = exports.getMyDepartmentBudget = exports.getDepartmentBudget = exports.createDepartmentBudget = void 0;
const departmentBudgetService_1 = require("../services/departmentBudgetService");
const prisma_1 = require("../lib/prisma");
const createDepartmentBudget = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        if (user.role === "DEPARTMENT_HEAD") {
            const dept = await prisma_1.prisma.department.findFirst({
                where: { id: body.departmentId, headId: user.id, organizationId: user.organizationId },
            });
            if (!dept) {
                return res.status(403).json({ error: "You can only create budgets for your own department" });
            }
        }
        const budget = await departmentBudgetService_1.departmentBudgetService.create({
            budgetPeriodId: body.budgetPeriodId,
            departmentId: body.departmentId,
            submittedByUserId: user.id,
            organizationId: user.organizationId,
        });
        return res.status(201).json(budget);
    }
    catch (err) {
        if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "DEPARTMENT_NOT_FOUND") {
            return res.status(400).json({ error: err.message });
        }
        if (err?.code === "DEPARTMENT_BUDGET_EXISTS") {
            return res.status(409).json({ error: err.message });
        }
        if (err?.code === "SUBMISSION_CLOSED") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.createDepartmentBudget = createDepartmentBudget;
const getDepartmentBudget = async (req, res) => {
    const user = req.user;
    const budget = await departmentBudgetService_1.departmentBudgetService.getById(req.params.id, user.organizationId);
    if (!budget)
        return res.status(404).json({ error: "Department budget not found" });
    if (user.role === "DEPARTMENT_HEAD") {
        const dept = await prisma_1.prisma.department.findFirst({
            where: { id: budget.departmentId, headId: user.id, organizationId: user.organizationId },
        });
        if (!dept) {
            return res.status(403).json({ error: "You do not have access to this budget" });
        }
    }
    return res.status(200).json(budget);
};
exports.getDepartmentBudget = getDepartmentBudget;
const getMyDepartmentBudget = async (req, res) => {
    const user = req.user;
    const { budgetPeriodId } = req.query;
    if (!budgetPeriodId) {
        return res.status(400).json({ error: "budgetPeriodId is required" });
    }
    if (user.role !== "DEPARTMENT_HEAD") {
        return res.status(403).json({ error: "Only department heads can access this endpoint" });
    }
    const dept = await prisma_1.prisma.department.findFirst({
        where: { headId: user.id, organizationId: user.organizationId },
        select: { id: true },
    });
    if (!dept) {
        return res.status(404).json({ error: "You are not a department head" });
    }
    const budget = await departmentBudgetService_1.departmentBudgetService.getByPeriodAndDepartment(budgetPeriodId, dept.id, user.organizationId);
    if (!budget)
        return res.status(404).json({ error: "Department budget not found" });
    return res.status(200).json(budget);
};
exports.getMyDepartmentBudget = getMyDepartmentBudget;
const listDepartmentBudgetsByPeriod = async (req, res) => {
    const user = req.user;
    const { budgetPeriodId } = req.query;
    if (!budgetPeriodId) {
        return res.status(400).json({ error: "budgetPeriodId is required" });
    }
    try {
        const budgets = await departmentBudgetService_1.departmentBudgetService.listByPeriod(budgetPeriodId, user.organizationId);
        return res.status(200).json({ data: budgets });
    }
    catch (err) {
        if (err?.code === "BUDGET_PERIOD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        throw err;
    }
};
exports.listDepartmentBudgetsByPeriod = listDepartmentBudgetsByPeriod;
const updateDepartmentBudget = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const budget = await departmentBudgetService_1.departmentBudgetService.update(req.params.id, user.organizationId, {
            totalProposedAmount: body.totalProposedAmount !== undefined ? BigInt(body.totalProposedAmount) : undefined,
            totalApprovedAmount: body.totalApprovedAmount !== undefined ? BigInt(body.totalApprovedAmount) : undefined,
            status: body.status,
            rejectionNotes: body.rejectionNotes,
        });
        if (!budget)
            return res.status(404).json({ error: "Department budget not found" });
        return res.status(200).json(budget);
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        throw err;
    }
};
exports.updateDepartmentBudget = updateDepartmentBudget;
const submitDepartmentBudget = async (req, res) => {
    const user = req.user;
    try {
        const budget = await departmentBudgetService_1.departmentBudgetService.submit(req.params.id, user.id, user.organizationId);
        return res.status(200).json(budget);
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "UNAUTHORIZED") {
            return res.status(403).json({ error: err.message });
        }
        if (err?.code === "INVALID_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        if (err?.code === "SUBMISSION_CLOSED") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.submitDepartmentBudget = submitDepartmentBudget;
const returnDepartmentBudgetForRevision = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const budget = await departmentBudgetService_1.departmentBudgetService.returnForRevision(req.params.id, user.organizationId, body.rejectionNotes);
        return res.status(200).json(budget);
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.returnDepartmentBudgetForRevision = returnDepartmentBudgetForRevision;
const approveDepartmentBudget = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const budget = await departmentBudgetService_1.departmentBudgetService.approve(req.params.id, user.organizationId, body.items.map((i) => ({ budgetItemId: i.budgetItemId, approvedTotal: BigInt(i.approvedTotal) })));
        return res.status(200).json(budget);
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_PERIOD_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        throw err;
    }
};
exports.approveDepartmentBudget = approveDepartmentBudget;
const rejectDepartmentBudget = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const budget = await departmentBudgetService_1.departmentBudgetService.reject(req.params.id, user.organizationId, body.rejectionNotes);
        return res.status(200).json(budget);
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.rejectDepartmentBudget = rejectDepartmentBudget;
const deleteDepartmentBudget = async (req, res) => {
    const user = req.user;
    try {
        const result = await departmentBudgetService_1.departmentBudgetService.delete(req.params.id, user.organizationId);
        if (result.count === 0)
            return res.status(404).json({ error: "Department budget not found" });
        return res.status(204).send();
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.deleteDepartmentBudget = deleteDepartmentBudget;
exports.departmentBudgetController = {
    createDepartmentBudget: exports.createDepartmentBudget,
    getDepartmentBudget: exports.getDepartmentBudget,
    getMyDepartmentBudget: exports.getMyDepartmentBudget,
    listDepartmentBudgetsByPeriod: exports.listDepartmentBudgetsByPeriod,
    updateDepartmentBudget: exports.updateDepartmentBudget,
    submitDepartmentBudget: exports.submitDepartmentBudget,
    returnDepartmentBudgetForRevision: exports.returnDepartmentBudgetForRevision,
    approveDepartmentBudget: exports.approveDepartmentBudget,
    rejectDepartmentBudget: exports.rejectDepartmentBudget,
    deleteDepartmentBudget: exports.deleteDepartmentBudget,
};
//# sourceMappingURL=departmentBudgetController.js.map