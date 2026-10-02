"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetController = exports.deleteBudget = exports.updateBudget = exports.getBudget = exports.listBudgets = exports.createBudget = void 0;
const budgetService_1 = require("../services/budgetService");
const pagination_1 = require("../utils/pagination");
const prisma_1 = require("../lib/prisma");
const createBudget = async (req, res) => {
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
        const budget = await budgetService_1.budgetService.create({
            departmentId: body.departmentId,
            fundId: body.fundId,
            fiscalYear: body.fiscalYear,
            month: body.month,
            amountInKobo: BigInt(body.amountInKobo),
            organizationId: user.organizationId,
        });
        return res.status(201).json(budget);
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_NOT_FOUND" || err?.code === "FUND_NOT_FOUND") {
            return res.status(400).json({ error: err.message });
        }
        if (err?.code === "P2002") {
            return res.status(409).json({ error: "A budget already exists for this department/fund/month." });
        }
        throw err;
    }
};
exports.createBudget = createBudget;
const listBudgets = async (req, res) => {
    const user = req.user;
    const params = (0, pagination_1.parsePagination)(req);
    const departmentId = req.query.departmentId || undefined;
    const fundId = req.query.fundId || undefined;
    const fiscalYearRaw = req.query.fiscalYear;
    const fiscalYear = fiscalYearRaw ? Number(fiscalYearRaw) : undefined;
    let scopedDepartmentId = departmentId;
    if (user.role === "DEPARTMENT_HEAD") {
        const dept = await prisma_1.prisma.department.findFirst({
            where: { headId: user.id, organizationId: user.organizationId },
            select: { id: true },
        });
        if (dept) {
            scopedDepartmentId = dept.id;
        }
        else {
            return res.status(200).json((0, pagination_1.buildPaginatedResponse)([], 0, params));
        }
    }
    const result = await budgetService_1.budgetService.list(params.page, params.pageSize, user.organizationId, {
        departmentId: scopedDepartmentId,
        fundId,
        fiscalYear,
    });
    return res.status(200).json((0, pagination_1.buildPaginatedResponse)(result.data, result.total, params));
};
exports.listBudgets = listBudgets;
const getBudget = async (req, res) => {
    const user = req.user;
    const budget = await budgetService_1.budgetService.getById(req.params.id, user.organizationId);
    if (!budget)
        return res.status(404).json({ error: "Budget not found" });
    if (user.role === "DEPARTMENT_HEAD" && budget.departmentId) {
        const dept = await prisma_1.prisma.department.findFirst({
            where: { id: budget.departmentId, headId: user.id, organizationId: user.organizationId },
        });
        if (!dept) {
            return res.status(403).json({ error: "You do not have access to this budget" });
        }
    }
    return res.status(200).json(budget);
};
exports.getBudget = getBudget;
const updateBudget = async (req, res) => {
    const user = req.user;
    const body = req.body;
    if (user.role === "DEPARTMENT_HEAD") {
        const existing = await budgetService_1.budgetService.getById(req.params.id, user.organizationId);
        if (!existing)
            return res.status(404).json({ error: "Budget not found" });
        const dept = await prisma_1.prisma.department.findFirst({
            where: { id: existing.departmentId, headId: user.id, organizationId: user.organizationId },
        });
        if (!dept) {
            return res.status(403).json({ error: "You can only update budgets for your own department" });
        }
    }
    try {
        const budget = await budgetService_1.budgetService.update(req.params.id, user.organizationId, {
            departmentId: body.departmentId,
            fundId: body.fundId,
            fiscalYear: body.fiscalYear,
            month: body.month,
            amountInKobo: body.amountInKobo !== undefined ? BigInt(body.amountInKobo) : undefined,
        });
        if (!budget)
            return res.status(404).json({ error: "Budget not found" });
        return res.status(200).json(budget);
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_NOT_FOUND" || err?.code === "FUND_NOT_FOUND") {
            return res.status(400).json({ error: err.message });
        }
        if (err?.code === "P2002") {
            return res.status(409).json({ error: "A budget already exists for this department/fund/month." });
        }
        throw err;
    }
};
exports.updateBudget = updateBudget;
const deleteBudget = async (req, res) => {
    const user = req.user;
    if (user.role === "DEPARTMENT_HEAD") {
        const existing = await budgetService_1.budgetService.getById(req.params.id, user.organizationId);
        if (!existing)
            return res.status(404).json({ error: "Budget not found" });
        const dept = await prisma_1.prisma.department.findFirst({
            where: { id: existing.departmentId, headId: user.id, organizationId: user.organizationId },
        });
        if (!dept) {
            return res.status(403).json({ error: "You can only delete budgets for your own department" });
        }
    }
    const result = await budgetService_1.budgetService.delete(req.params.id, user.organizationId);
    if (result.count === 0)
        return res.status(404).json({ error: "Budget not found" });
    return res.status(204).send();
};
exports.deleteBudget = deleteBudget;
exports.budgetController = { createBudget: exports.createBudget, listBudgets: exports.listBudgets, getBudget: exports.getBudget, updateBudget: exports.updateBudget, deleteBudget: exports.deleteBudget };
//# sourceMappingURL=budgetController.js.map