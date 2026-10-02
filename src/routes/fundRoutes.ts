import { Router } from "express";
import { fundController } from "../controllers/fundController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createFundSchema, updateFundSchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("fund:read"), validateQuery(paginationQuerySchema), fundController.listFunds);
router.get("/:id", checkPermission("fund:read"), fundController.getFund);
router.post("/", checkPermission("fund:create"), validateBody(createFundSchema), fundController.createFund);
router.patch("/:id", checkPermission("fund:update"), validateBody(updateFundSchema), fundController.updateFund);
router.delete("/:id", checkPermission("fund:delete"), fundController.deleteFund);

export default router;