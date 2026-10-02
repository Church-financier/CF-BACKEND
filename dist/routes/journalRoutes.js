"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const journalController_1 = require("../controllers/journalController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("ledger:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), journalController_1.journalController.listJournalEntries);
router.post("/", (0, rbacMiddleware_1.checkPermission)("ledger:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createJournalEntrySchema), journalController_1.journalController.createJournalEntry);
router.patch("/:id/reverse", (0, rbacMiddleware_1.checkPermission)("ledger:reverse"), (0, validationMiddleware_1.validateBody)(schemas_1.reverseJournalEntrySchema), journalController_1.journalController.reverseJournalEntry);
exports.default = router;
//# sourceMappingURL=journalRoutes.js.map