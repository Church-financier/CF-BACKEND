import { Router } from "express";
import { periodController } from "../controllers/periodController";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validationMiddleware";
import { lockPeriodSchema } from "../schemas";

const router = Router();

router.use(authenticate);
router.get("/", requireRole("SUPER_ADMIN", "TREASURER", "AUDITOR"), periodController.listPeriods);
router.post("/lock", requireRole("SUPER_ADMIN", "TREASURER"), validateBody(lockPeriodSchema), periodController.lockPeriod);
router.post("/unlock", requireRole("SUPER_ADMIN"), validateBody(lockPeriodSchema), periodController.unlockPeriod);

export default router;
