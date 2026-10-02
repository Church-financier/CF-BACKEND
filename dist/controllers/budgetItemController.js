"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetItemController = exports.deleteBudgetItem = exports.bulkUpdateBudgetItemApprovedTotals = exports.updateBudgetItemApprovedTotal = exports.updateBudgetItem = exports.listBudgetItemsByDepartmentBudget = exports.getBudgetItem = exports.listExpenseCategories = exports.createBudgetItem = void 0;
const budgetItemService_1 = require("../services/budgetItemService");
const departmentBudgetService_1 = require("../services/departmentBudgetService");
const createBudgetItem = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const deptBudget = await departmentBudgetService_1.departmentBudgetService.getById(body.departmentBudgetId, user.organizationId);
        if (!deptBudget) {
            return res.status(404).json({ error: "Department budget not found" });
        }
        if (user.role === "DEPARTMENT_HEAD") {
            if (deptBudget.submittedByUserId !== user.id) {
                return res.status(403).json({ error: "You can only add items to your own department budget" });
            }
        }
        if (!["DRAFT", "REVISED"].includes(deptBudget.status)) {
            return res.status(400).json({ error: "Cannot add items to a non-draft budget" });
        }
        if (deptBudget.budgetPeriod.status !== "SUBMISSION_OPEN" && deptBudget.budgetPeriod.status !== "UNDER_REVIEW") {
            return res.status(400).json({ error: "Budget submission window is closed" });
        }
        const proposedTotal = BigInt(body.unitCost) * BigInt(body.quantity ?? 1);
        const item = await budgetItemService_1.budgetItemService.create({
            departmentBudgetId: body.departmentBudgetId,
            categoryId: body.categoryId,
            itemName: body.itemName,
            description: body.description,
            unitCost: BigInt(body.unitCost),
            quantity: body.quantity ?? 1,
            proposedTotal,
            organizationId: user.organizationId,
        });
        await departmentBudgetService_1.departmentBudgetService.recalculateTotals(body.departmentBudgetId, user.organizationId);
        return res.status(201).json(item);
    }
    catch (err) {
        if (err?.code === "DEPARTMENT_BUDGET_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_CATEGORY") {
            return res.status(400).json({ error: err.message });
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
exports.createBudgetItem = createBudgetItem;
/**
 * Expense categories for the budget line-item picker.
 *
 * Scoped to `budget:read` so a department head can categorise their own
 * request without being granted organization-wide chart-of-accounts access.
 */
const listExpenseCategories = async (req, res) => {
    const categories = await budgetItemService_1.budgetItemService.listExpenseCategories(req.user.organizationId);
    return res.status(200).json({ data: categories });
};
exports.listExpenseCategories = listExpenseCategories;
const getBudgetItem = async (req, res) => {
    const user = req.user;
    const item = await budgetItemService_1.budgetItemService.getById(req.params.id, user.organizationId);
    if (!item)
        return res.status(404).json({ error: "Budget item not found" });
    return res.status(200).json(item);
};
exports.getBudgetItem = getBudgetItem;
const listBudgetItemsByDepartmentBudget = async (req, res) => {
    const user = req.user;
    const { departmentBudgetId } = req.query;
    if (!departmentBudgetId) {
        return res.status(400).json({ error: "departmentBudgetId is required" });
    }
    const items = await budgetItemService_1.budgetItemService.listByDepartmentBudget(departmentBudgetId, user.organizationId);
    return res.status(200).json({ data: items });
};
exports.listBudgetItemsByDepartmentBudget = listBudgetItemsByDepartmentBudget;
const updateBudgetItem = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const item = await budgetItemService_1.budgetItemService.getById(req.params.id, user.organizationId);
        if (!item)
            return res.status(404).json({ error: "Budget item not found" });
        if (user.role === "DEPARTMENT_HEAD") {
            if (item.departmentBudget.submittedByUserId !== user.id) {
                return res.status(403).json({ error: "You can only update items in your own department budget" });
            }
        }
        if (!["DRAFT", "REVISED"].includes(item.departmentBudget.status)) {
            return res.status(400).json({ error: "Cannot update items in a non-draft budget" });
        }
        if (item.departmentBudget.budgetPeriod.status !== "SUBMISSION_OPEN" && item.departmentBudget.budgetPeriod.status !== "UNDER_REVIEW") {
            return res.status(400).json({ error: "Budget submission window is closed" });
        }
        const proposedTotal = body.unitCost !== undefined && body.quantity !== undefined
            ? BigInt(body.unitCost) * BigInt(body.quantity)
            : body.unitCost !== undefined
                ? BigInt(body.unitCost) * BigInt(item.quantity)
                : body.quantity !== undefined
                    ? item.unitCost * BigInt(body.quantity)
                    : undefined;
        const updated = await budgetItemService_1.budgetItemService.update(req.params.id, user.organizationId, {
            categoryId: body.categoryId,
            itemName: body.itemName,
            description: body.description,
            unitCost: body.unitCost !== undefined ? BigInt(body.unitCost) : undefined,
            quantity: body.quantity,
            proposedTotal,
        });
        await departmentBudgetService_1.departmentBudgetService.recalculateTotals(item.departmentBudgetId, user.organizationId);
        return res.status(200).json(updated);
    }
    catch (err) {
        if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_CATEGORY") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.updateBudgetItem = updateBudgetItem;
const updateBudgetItemApprovedTotal = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        const item = await budgetItemService_1.budgetItemService.updateApprovedTotal(req.params.id, user.organizationId, BigInt(body.approvedTotal));
        if (!item)
            return res.status(404).json({ error: "Budget item not found" });
        await departmentBudgetService_1.departmentBudgetService.recalculateTotals(item.departmentBudgetId, user.organizationId);
        return res.status(200).json(item);
    }
    catch (err) {
        if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_PERIOD_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.updateBudgetItemApprovedTotal = updateBudgetItemApprovedTotal;
const bulkUpdateBudgetItemApprovedTotals = async (req, res) => {
    const user = req.user;
    const body = req.body;
    try {
        await budgetItemService_1.budgetItemService.bulkUpdateApprovedTotals(user.organizationId, body.items.map((i) => ({ budgetItemId: i.budgetItemId, approvedTotal: BigInt(i.approvedTotal) })));
        return res.status(200).json({ success: true });
    }
    catch (err) {
        if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err?.code === "INVALID_PERIOD_STATUS") {
            return res.status(400).json({ error: err.message });
        }
        throw err;
    }
};
exports.bulkUpdateBudgetItemApprovedTotals = bulkUpdateBudgetItemApprovedTotals;
const deleteBudgetItem = async (req, res) => {
    const user = req.user;
    try {
        const item = await budgetItemService_1.budgetItemService.getById(req.params.id, user.organizationId);
        if (!item)
            return res.status(404).json({ error: "Budget item not found" });
        if (user.role === "DEPARTMENT_HEAD") {
            if (item.departmentBudget.submittedByUserId !== user.id) {
                return res.status(403).json({ error: "You can only delete items from your own department budget" });
            }
        }
        const deptBudgetId = item.departmentBudgetId;
        await budgetItemService_1.budgetItemService.delete(req.params.id, user.organizationId);
        await departmentBudgetService_1.departmentBudgetService.recalculateTotals(deptBudgetId, user.organizationId);
        return res.status(204).send();
    }
    catch (err) {
        if (err?.code === "BUDGET_ITEM_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
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
exports.deleteBudgetItem = deleteBudgetItem;
exports.budgetItemController = {
    createBudgetItem: exports.createBudgetItem,
    listExpenseCategories: exports.listExpenseCategories,
    getBudgetItem: exports.getBudgetItem,
    listBudgetItemsByDepartmentBudget: exports.listBudgetItemsByDepartmentBudget,
    updateBudgetItem: exports.updateBudgetItem,
    updateBudgetItemApprovedTotal: exports.updateBudgetItemApprovedTotal,
    bulkUpdateBudgetItemApprovedTotals: exports.bulkUpdateBudgetItemApprovedTotals,
    deleteBudgetItem: exports.deleteBudgetItem,
};
//# sourceMappingURL=budgetItemController.js.map