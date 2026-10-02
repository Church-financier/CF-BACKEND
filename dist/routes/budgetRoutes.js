"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const budgetController_1 = require("../controllers/budgetController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("budget:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), budgetController_1.budgetController.listBudgets);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("budget:read"), budgetController_1.budgetController.getBudget);
router.post("/", (0, rbacMiddleware_1.checkPermission)("budget:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createBudgetSchema), budgetController_1.budgetController.createBudget);
router.patch("/:id", (0, rbacMiddleware_1.checkPermission)("budget:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateBudgetSchema), budgetController_1.budgetController.updateBudget);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("budget:delete"), budgetController_1.budgetController.deleteBudget);
exports.default = router;
//# sourceMappingURL=budgetRoutes.js.map