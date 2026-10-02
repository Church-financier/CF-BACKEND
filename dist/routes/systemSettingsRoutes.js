"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemSettingsController_1 = require("../controllers/systemSettingsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", systemSettingsController_1.systemSettingsController.getSystemSettings);
router.put("/", (0, authMiddleware_1.requireRole)("SUPER_ADMIN"), (0, validationMiddleware_1.validateBody)(schemas_1.systemSettingsUpdateSchema), systemSettingsController_1.systemSettingsController.updateSystemSettings);
exports.default = router;
//# sourceMappingURL=systemSettingsRoutes.js.map