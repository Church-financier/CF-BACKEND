"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/balance-sheet", (0, rbacMiddleware_1.checkPermission)("report:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.reportQuerySchema), reportController_1.reportController.getBalanceSheet);
router.get("/statement-of-activities", (0, rbacMiddleware_1.checkPermission)("report:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.reportQuerySchema), reportController_1.reportController.getStatementOfActivities);
router.get("/budget-vs-actual", (0, rbacMiddleware_1.checkPermission)("report:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.reportQuerySchema), reportController_1.reportController.getBudgetVsActual);
router.get("/trial-balance", (0, rbacMiddleware_1.checkPermission)("report:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.reportQuerySchema), reportController_1.reportController.getTrialBalance);
router.get("/cash-flow", (0, rbacMiddleware_1.checkPermission)("report:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.reportQuerySchema), reportController_1.reportController.getCashFlow);
router.get("/export", (0, rbacMiddleware_1.checkPermission)("report:export"), (0, validationMiddleware_1.validateQuery)(schemas_1.reportQuerySchema), reportController_1.reportController.exportReport);
router.get("/metrics", (0, rbacMiddleware_1.checkPermission)("report:read"), reportController_1.reportController.getMetrics);
router.get("/income-overview", (0, rbacMiddleware_1.checkPermission)("report:income"), reportController_1.reportController.getIncomeOverview);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map