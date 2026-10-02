"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const periodController_1 = require("../controllers/periodController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authMiddleware_2 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get("/", (0, authMiddleware_2.requireRole)("SUPER_ADMIN", "TREASURER", "AUDITOR"), periodController_1.periodController.listPeriods);
router.post("/lock", (0, authMiddleware_2.requireRole)("SUPER_ADMIN", "TREASURER"), (0, validationMiddleware_1.validateBody)(schemas_1.lockPeriodSchema), periodController_1.periodController.lockPeriod);
router.post("/unlock", (0, authMiddleware_2.requireRole)("SUPER_ADMIN"), (0, validationMiddleware_1.validateBody)(schemas_1.lockPeriodSchema), periodController_1.periodController.unlockPeriod);
exports.default = router;
//# sourceMappingURL=periodRoutes.js.map