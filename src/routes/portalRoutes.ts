import { Router } from "express";
import { portalController } from "../controllers/portalController";
import { portalAuthenticate } from "../services/portalAuthService";
import { authenticate } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/rbacMiddleware";
import { z } from "zod";
import { validateBody } from "../middleware/validationMiddleware";

const router = Router();

const portalLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const portalChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const portalForgotSchema = z.object({ email: z.string().email() });
const adminSetPortalSchema = z.object({
  enabled: z.boolean(),
  password: z.string().min(6).optional(),
});

// public
router.post("/login", validateBody(portalLoginSchema), portalController.portalLogin);
router.post("/refresh", portalController.portalRefresh);
router.post("/logout", portalController.portalLogout);
router.post("/forgot-password", validateBody(portalForgotSchema), portalController.portalForgotPassword);

// authenticated portal member
router.get("/me", portalAuthenticate, portalController.portalMe);
router.get("/summary", portalAuthenticate, portalController.portalSummary);
router.post("/change-password", portalAuthenticate, validateBody(portalChangePasswordSchema), portalController.portalChangePassword);

// admin actions to manage member portal access
router.post(
  "/members/:id/portal-access",
  authenticate,
  checkPermission("member:update"),
  validateBody(adminSetPortalSchema),
  portalController.adminSetPortalAccess
);

export default router;