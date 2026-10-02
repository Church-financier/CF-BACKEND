import { Router } from "express";
import { reportController } from "../controllers/reportController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateQuery } from "../middleware/validationMiddleware";
import { reportQuerySchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/balance-sheet", checkPermission("report:read"), validateQuery(reportQuerySchema), reportController.getBalanceSheet);
router.get("/statement-of-activities", checkPermission("report:read"), validateQuery(reportQuerySchema), reportController.getStatementOfActivities);
router.get("/budget-vs-actual", checkPermission("report:read"), validateQuery(reportQuerySchema), reportController.getBudgetVsActual);
router.get("/trial-balance", checkPermission("report:read"), validateQuery(reportQuerySchema), reportController.getTrialBalance);
router.get("/cash-flow", checkPermission("report:read"), validateQuery(reportQuerySchema), reportController.getCashFlow);
router.get("/export", checkPermission("report:export"), validateQuery(reportQuerySchema), reportController.exportReport);
router.get("/metrics", checkPermission("report:read"), reportController.getMetrics);
router.get("/income-overview", checkPermission("report:income"), reportController.getIncomeOverview);

export default router;
