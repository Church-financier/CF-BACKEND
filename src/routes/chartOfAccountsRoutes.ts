import { Router } from "express";
import { chartOfAccountsController } from "../controllers/chartOfAccountsController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createChartOfAccountSchema, updateChartOfAccountSchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("chart-of-accounts:read"), validateQuery(paginationQuerySchema), chartOfAccountsController.listAccounts);
router.get("/:id", checkPermission("chart-of-accounts:read"), chartOfAccountsController.getAccount);
router.post("/", checkPermission("chart-of-accounts:create"), validateBody(createChartOfAccountSchema), chartOfAccountsController.createAccount);
router.patch("/:id", checkPermission("chart-of-accounts:update"), validateBody(updateChartOfAccountSchema), chartOfAccountsController.updateAccount);
router.delete("/:id", checkPermission("chart-of-accounts:delete"), chartOfAccountsController.deleteAccount);

export default router;