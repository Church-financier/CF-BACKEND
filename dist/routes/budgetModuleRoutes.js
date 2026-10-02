"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budgetPeriodController_1 = require("../controllers/budgetPeriodController");
const departmentBudgetController_1 = require("../controllers/departmentBudgetController");
const budgetItemController_1 = require("../controllers/budgetItemController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Budget Period routes
router.get("/periods", (0, rbacMiddleware_1.checkPermission)("budget:read"), (0, validationMiddleware_1.validateQuery)(require("../schemas").paginationQuerySchema), budgetPeriodController_1.budgetPeriodController.listBudgetPeriods);
router.get("/periods/active", (0, rbacMiddleware_1.checkPermission)("budget:read"), budgetPeriodController_1.budgetPeriodController.getActiveBudgetPeriod);
router.get("/periods/:id", (0, rbacMiddleware_1.checkPermission)("budget:read"), budgetPeriodController_1.budgetPeriodController.getBudgetPeriod);
router.post("/periods", (0, rbacMiddleware_1.checkPermission)("budget:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createBudgetPeriodSchema), budgetPeriodController_1.budgetPeriodController.createBudgetPeriod);
router.patch("/periods/:id", (0, rbacMiddleware_1.checkPermission)("budget:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateBudgetPeriodSchema), budgetPeriodController_1.budgetPeriodController.updateBudgetPeriod);
router.post("/periods/:id/open-submission", (0, rbacMiddleware_1.checkPermission)("budget:update"), budgetPeriodController_1.budgetPeriodController.openBudgetSubmission);
router.post("/periods/:id/close-submission", (0, rbacMiddleware_1.checkPermission)("budget:update"), budgetPeriodController_1.budgetPeriodController.closeBudgetSubmission);
router.post("/periods/:id/approve-and-lock", (0, rbacMiddleware_1.checkPermission)("budget:update"), budgetPeriodController_1.budgetPeriodController.approveAndLockBudgetPeriod);
router.delete("/periods/:id", (0, rbacMiddleware_1.checkPermission)("budget:delete"), budgetPeriodController_1.budgetPeriodController.deleteBudgetPeriod);
// Department Budget routes
router.post("/department-budgets", (0, rbacMiddleware_1.checkPermission)("budget:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createDepartmentBudgetSchema), departmentBudgetController_1.departmentBudgetController.createDepartmentBudget);
router.get("/department-budgets/me", (0, rbacMiddleware_1.checkPermission)("budget:read"), departmentBudgetController_1.departmentBudgetController.getMyDepartmentBudget);
router.get("/department-budgets", (0, rbacMiddleware_1.checkPermission)("budget:read"), (0, validationMiddleware_1.validateQuery)(require("../schemas").paginationQuerySchema), departmentBudgetController_1.departmentBudgetController.listDepartmentBudgetsByPeriod);
router.get("/department-budgets/:id", (0, rbacMiddleware_1.checkPermission)("budget:read"), departmentBudgetController_1.departmentBudgetController.getDepartmentBudget);
router.patch("/department-budgets/:id", (0, rbacMiddleware_1.checkPermission)("budget:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateDepartmentBudgetSchema), departmentBudgetController_1.departmentBudgetController.updateDepartmentBudget);
router.post("/department-budgets/:id/submit", (0, rbacMiddleware_1.checkPermission)("budget:create"), (0, validationMiddleware_1.validateBody)(schemas_1.submitDepartmentBudgetSchema), departmentBudgetController_1.departmentBudgetController.submitDepartmentBudget);
router.post("/department-budgets/:id/return", (0, rbacMiddleware_1.checkPermission)("budget:update"), (0, validationMiddleware_1.validateBody)(schemas_1.submitDepartmentBudgetSchema), departmentBudgetController_1.departmentBudgetController.returnDepartmentBudgetForRevision);
router.post("/department-budgets/:id/approve", (0, rbacMiddleware_1.checkPermission)("budget:update"), (0, validationMiddleware_1.validateBody)(schemas_1.approveDepartmentBudgetSchema), departmentBudgetController_1.departmentBudgetController.approveDepartmentBudget);
router.post("/department-budgets/:id/reject", (0, rbacMiddleware_1.checkPermission)("budget:update"), (0, validationMiddleware_1.validateBody)(schemas_1.submitDepartmentBudgetSchema), departmentBudgetController_1.departmentBudgetController.rejectDepartmentBudget);
router.delete("/department-budgets/:id", (0, rbacMiddleware_1.checkPermission)("budget:delete"), departmentBudgetController_1.departmentBudgetController.deleteDepartmentBudget);
// Budget Item routes
router.get("/expense-categories", (0, rbacMiddleware_1.checkPermission)("budget:read"), budgetItemController_1.budgetItemController.listExpenseCategories);
router.post("/budget-items", (0, rbacMiddleware_1.checkPermission)("budget:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createBudgetItemSchema), budgetItemController_1.budgetItemController.createBudgetItem);
router.get("/budget-items", (0, rbacMiddleware_1.checkPermission)("budget:read"), budgetItemController_1.budgetItemController.listBudgetItemsByDepartmentBudget);
router.get("/budget-items/:id", (0, rbacMiddleware_1.checkPermission)("budget:read"), budgetItemController_1.budgetItemController.getBudgetItem);
router.patch("/budget-items/:id", (0, rbacMiddleware_1.checkPermission)("budget:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateBudgetItemSchema), budgetItemController_1.budgetItemController.updateBudgetItem);
router.patch("/budget-items/:id/approved-total", (0, rbacMiddleware_1.checkPermission)("budget:update"), budgetItemController_1.budgetItemController.updateBudgetItemApprovedTotal);
router.post("/budget-items/bulk-update-approved", (0, rbacMiddleware_1.checkPermission)("budget:update"), (0, validationMiddleware_1.validateBody)(schemas_1.approveDepartmentBudgetSchema), budgetItemController_1.budgetItemController.bulkUpdateBudgetItemApprovedTotals);
router.delete("/budget-items/:id", (0, rbacMiddleware_1.checkPermission)("budget:update"), budgetItemController_1.budgetItemController.deleteBudgetItem);
exports.default = router;
//# sourceMappingURL=budgetModuleRoutes.js.map