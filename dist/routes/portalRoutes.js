"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portalController_1 = require("../controllers/portalController");
const portalAuthService_1 = require("../services/portalAuthService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const zod_1 = require("zod");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
const portalLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const portalChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
const portalForgotSchema = zod_1.z.object({ email: zod_1.z.string().email() });
const adminSetPortalSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    password: zod_1.z.string().min(6).optional(),
});
// public
router.post("/login", (0, validationMiddleware_1.validateBody)(portalLoginSchema), portalController_1.portalController.portalLogin);
router.post("/refresh", portalController_1.portalController.portalRefresh);
router.post("/logout", portalController_1.portalController.portalLogout);
router.post("/forgot-password", (0, validationMiddleware_1.validateBody)(portalForgotSchema), portalController_1.portalController.portalForgotPassword);
// authenticated portal member
router.get("/me", portalAuthService_1.portalAuthenticate, portalController_1.portalController.portalMe);
router.get("/summary", portalAuthService_1.portalAuthenticate, portalController_1.portalController.portalSummary);
router.post("/change-password", portalAuthService_1.portalAuthenticate, (0, validationMiddleware_1.validateBody)(portalChangePasswordSchema), portalController_1.portalController.portalChangePassword);
// admin actions to manage member portal access
router.post("/members/:id/portal-access", authMiddleware_1.authenticate, (0, rbacMiddleware_1.checkPermission)("member:update"), (0, validationMiddleware_1.validateBody)(adminSetPortalSchema), portalController_1.portalController.adminSetPortalAccess);
exports.default = router;
//# sourceMappingURL=portalRoutes.js.map