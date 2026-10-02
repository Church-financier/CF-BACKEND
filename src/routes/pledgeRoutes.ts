import { Router } from "express";
import { pledgeController } from "../controllers/pledgeController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createPledgeSchema, updatePledgeSchema, paginationQuerySchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("pledge:read"), validateQuery(paginationQuerySchema), pledgeController.listPledges);
router.get("/:id", checkPermission("pledge:read"), pledgeController.getPledge);
router.post("/", checkPermission("pledge:create"), validateBody(createPledgeSchema), pledgeController.createPledge);
router.patch("/:id", checkPermission("pledge:update"), validateBody(updatePledgeSchema), pledgeController.updatePledge);
router.patch("/:id/cancel", checkPermission("pledge:update"), pledgeController.cancelPledge);
router.delete("/:id", checkPermission("pledge:delete"), pledgeController.deletePledge);
router.get("/:id/progress", checkPermission("pledge:read"), pledgeController.getPledgeProgress);

export default router;