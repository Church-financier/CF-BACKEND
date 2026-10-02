"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ledgerController_1 = require("../controllers/ledgerController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
router.get("/", (0, rbacMiddleware_1.checkPermission)("ledger:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), ledgerController_1.ledgerController.listLedgerEntries);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("ledger:read"), ledgerController_1.ledgerController.getLedgerEntry);
router.post("/", (0, rbacMiddleware_1.checkPermission)("ledger:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createLedgerEntrySchema), ledgerController_1.ledgerController.createLedgerEntry);
router.patch("/:id/reverse", (0, rbacMiddleware_1.checkPermission)("ledger:reverse"), (0, validationMiddleware_1.validateBody)(schemas_1.reverseLedgerEntrySchema), ledgerController_1.ledgerController.reverseLedgerEntry);
exports.default = router;
//# sourceMappingURL=ledgerRoutes.js.map