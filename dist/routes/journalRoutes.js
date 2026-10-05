"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const journalController_1 = require("../controllers/journalController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const idempotencyMiddleware_1 = require("../middleware/idempotencyMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Journal posting is the general-ledger write path, so it is replay-protected
// as well: a retried post must not duplicate the double entry.
router.use((0, idempotencyMiddleware_1.requireIdempotencyKey)());
router.get("/", (0, rbacMiddleware_1.checkPermission)("ledger:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), journalController_1.journalController.listJournalEntries);
router.post("/", (0, rbacMiddleware_1.checkPermission)("ledger:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createJournalEntrySchema), journalController_1.journalController.createJournalEntry);
router.patch("/:id/reverse", (0, rbacMiddleware_1.checkPermission)("ledger:reverse"), (0, validationMiddleware_1.validateBody)(schemas_1.reverseJournalEntrySchema), journalController_1.journalController.reverseJournalEntry);
exports.default = router;
//# sourceMappingURL=journalRoutes.js.map