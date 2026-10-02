import { Router } from "express";
import { authController } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validationMiddleware";
import { authLimiter } from "../middleware/rateLimiter";
import {
  loginSchema,
  signupSchema,
  registerChurchSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  mfaVerifySchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../schemas";

const router = Router();

router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/login/mfa", authLimiter, validateBody(mfaVerifySchema), authController.verifyMfa);
router.post("/signup", authLimiter, validateBody(signupSchema), authController.signup);
router.post("/register", authLimiter, validateBody(registerChurchSchema), authController.registerChurch);
router.post("/logout", authenticate, authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", authenticate, authController.me);
router.patch("/me", authenticate, validateBody(updateProfileSchema), authController.updateProfile);
router.post("/change-password", authenticate, validateBody(changePasswordSchema), authController.changePassword);
router.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
router.post("/verify-email", authLimiter, validateBody(verifyEmailSchema), authController.verifyEmail);
router.post("/mfa/enable", authenticate, authController.enableMfa);
router.post("/mfa/disable", authenticate, authController.disableMfa);

export default router;
