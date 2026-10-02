import { Router } from "express";
import { budgetPeriodController } from "../controllers/budgetPeriodController";
import { departmentBudgetController } from "../controllers/departmentBudgetController";
import { budgetItemController } from "../controllers/budgetItemController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import {
  createBudgetPeriodSchema,
  updateBudgetPeriodSchema,
  createDepartmentBudgetSchema,
  updateDepartmentBudgetSchema,
  createBudgetItemSchema,
  updateBudgetItemSchema,
  submitDepartmentBudgetSchema,
  approveDepartmentBudgetSchema,
  approveBudgetPeriodSchema,
} from "../schemas";

const router = Router();

// Budget Period routes
router.get("/periods", checkPermission("budget:read"), validateQuery(require("../schemas").paginationQuerySchema), budgetPeriodController.listBudgetPeriods);
router.get("/periods/active", checkPermission("budget:read"), budgetPeriodController.getActiveBudgetPeriod);
router.get("/periods/:id", checkPermission("budget:read"), budgetPeriodController.getBudgetPeriod);
router.post("/periods", checkPermission("budget:create"), validateBody(createBudgetPeriodSchema), budgetPeriodController.createBudgetPeriod);
router.patch("/periods/:id", checkPermission("budget:update"), validateBody(updateBudgetPeriodSchema), budgetPeriodController.updateBudgetPeriod);
router.post("/periods/:id/open-submission", checkPermission("budget:update"), budgetPeriodController.openBudgetSubmission);
router.post("/periods/:id/close-submission", checkPermission("budget:update"), budgetPeriodController.closeBudgetSubmission);
router.post("/periods/:id/approve-and-lock", checkPermission("budget:update"), budgetPeriodController.approveAndLockBudgetPeriod);
router.delete("/periods/:id", checkPermission("budget:delete"), budgetPeriodController.deleteBudgetPeriod);

// Department Budget routes
router.post("/department-budgets", checkPermission("budget:create"), validateBody(createDepartmentBudgetSchema), departmentBudgetController.createDepartmentBudget);
router.get("/department-budgets/me", checkPermission("budget:read"), departmentBudgetController.getMyDepartmentBudget);
router.get("/department-budgets", checkPermission("budget:read"), validateQuery(require("../schemas").paginationQuerySchema), departmentBudgetController.listDepartmentBudgetsByPeriod);
router.get("/department-budgets/:id", checkPermission("budget:read"), departmentBudgetController.getDepartmentBudget);
router.patch("/department-budgets/:id", checkPermission("budget:update"), validateBody(updateDepartmentBudgetSchema), departmentBudgetController.updateDepartmentBudget);
router.post("/department-budgets/:id/submit", checkPermission("budget:create"), validateBody(submitDepartmentBudgetSchema), departmentBudgetController.submitDepartmentBudget);
router.post("/department-budgets/:id/return", checkPermission("budget:update"), validateBody(submitDepartmentBudgetSchema), departmentBudgetController.returnDepartmentBudgetForRevision);
router.post("/department-budgets/:id/approve", checkPermission("budget:update"), validateBody(approveDepartmentBudgetSchema), departmentBudgetController.approveDepartmentBudget);
router.post("/department-budgets/:id/reject", checkPermission("budget:update"), validateBody(submitDepartmentBudgetSchema), departmentBudgetController.rejectDepartmentBudget);
router.delete("/department-budgets/:id", checkPermission("budget:delete"), departmentBudgetController.deleteDepartmentBudget);

// Budget Item routes
router.get("/expense-categories", checkPermission("budget:read"), budgetItemController.listExpenseCategories);
router.post("/budget-items", checkPermission("budget:create"), validateBody(createBudgetItemSchema), budgetItemController.createBudgetItem);
router.get("/budget-items", checkPermission("budget:read"), budgetItemController.listBudgetItemsByDepartmentBudget);
router.get("/budget-items/:id", checkPermission("budget:read"), budgetItemController.getBudgetItem);
router.patch("/budget-items/:id", checkPermission("budget:update"), validateBody(updateBudgetItemSchema), budgetItemController.updateBudgetItem);
router.patch("/budget-items/:id/approved-total", checkPermission("budget:update"), budgetItemController.updateBudgetItemApprovedTotal);
router.post("/budget-items/bulk-update-approved", checkPermission("budget:update"), validateBody(approveDepartmentBudgetSchema), budgetItemController.bulkUpdateBudgetItemApprovedTotals);
router.delete("/budget-items/:id", checkPermission("budget:update"), budgetItemController.deleteBudgetItem);

export default router;