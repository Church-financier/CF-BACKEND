import { Router } from "express";
import { organizationController } from "../controllers/organizationController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { validateBody } from "../middleware/validationMiddleware";
import { updateOrganizationSchema } from "../schemas";

const router = Router();

router.get("/", checkPermission("user:manage"), organizationController.getOrganization);
router.patch("/", checkPermission("user:manage"), validateBody(updateOrganizationSchema), organizationController.updateOrganization);

export default router;