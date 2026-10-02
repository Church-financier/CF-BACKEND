import { Router } from "express";
import { budgetController } from "../controllers/budgetController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createBudgetSchema, updateBudgetSchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("budget:read"), validateQuery(paginationQuerySchema), budgetController.listBudgets);
router.get("/:id", checkPermission("budget:read"), budgetController.getBudget);
router.post("/", checkPermission("budget:create"), validateBody(createBudgetSchema), budgetController.createBudget);
router.patch("/:id", checkPermission("budget:update"), validateBody(updateBudgetSchema), budgetController.updateBudget);
router.delete("/:id", checkPermission("budget:delete"), budgetController.deleteBudget);

export default router;