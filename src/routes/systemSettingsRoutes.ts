import { Router } from "express";
import { systemSettingsController } from "../controllers/systemSettingsController";
import { requireRole } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validationMiddleware";
import { systemSettingsUpdateSchema } from "../schemas";

const router = Router();

router.get("/", systemSettingsController.getSystemSettings);
router.put(
  "/",
  requireRole("SUPER_ADMIN"),
  validateBody(systemSettingsUpdateSchema),
  systemSettingsController.updateSystemSettings
);

export default router;
