"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chartOfAccountsController_1 = require("../controllers/chartOfAccountsController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("chart-of-accounts:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), chartOfAccountsController_1.chartOfAccountsController.listAccounts);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("chart-of-accounts:read"), chartOfAccountsController_1.chartOfAccountsController.getAccount);
router.post("/", (0, rbacMiddleware_1.checkPermission)("chart-of-accounts:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createChartOfAccountSchema), chartOfAccountsController_1.chartOfAccountsController.createAccount);
router.patch("/:id", (0, rbacMiddleware_1.checkPermission)("chart-of-accounts:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateChartOfAccountSchema), chartOfAccountsController_1.chartOfAccountsController.updateAccount);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("chart-of-accounts:delete"), chartOfAccountsController_1.chartOfAccountsController.deleteAccount);
exports.default = router;
//# sourceMappingURL=chartOfAccountsRoutes.js.map