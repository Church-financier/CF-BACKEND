"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contributionController_1 = require("../controllers/contributionController");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const idempotencyMiddleware_1 = require("../middleware/idempotencyMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Every contribution write is replay-protected: a double-clicked or retried
// submission must not post a second ledger entry.
router.use((0, idempotencyMiddleware_1.requireIdempotencyKey)());
router.get("/funds", (0, rbacMiddleware_1.checkAnyPermission)("fund:read", "contribution:read", "pledge:read"), contributionController_1.contributionController.listContributionFunds);
router.get("/member/:memberId/statement", (0, rbacMiddleware_1.checkPermission)("contribution:read"), contributionController_1.contributionController.getMemberStatement);
router.get("/", (0, rbacMiddleware_1.checkPermission)("contribution:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), contributionController_1.contributionController.listContributions);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("contribution:read"), contributionController_1.contributionController.getContribution);
router.patch("/:id", (0, rbacMiddleware_1.checkPermission)("contribution:update"), (0, validationMiddleware_1.validateBody)(schemas_1.updateContributionSchema), contributionController_1.contributionController.updateContribution);
router.delete("/:id", (0, rbacMiddleware_1.checkPermission)("contribution:delete"), (0, validationMiddleware_1.validateBody)(schemas_1.deleteContributionSchema), contributionController_1.contributionController.deleteContribution);
router.post("/", (0, rbacMiddleware_1.checkPermission)("contribution:create"), (0, validationMiddleware_1.validateBody)(schemas_1.singleContributionSchema), contributionController_1.contributionController.createSingleContribution);
router.post("/batch", (0, rbacMiddleware_1.checkPermission)("contribution:create"), (0, validationMiddleware_1.validateBody)(schemas_1.batchEntrySchema), contributionController_1.contributionController.batchCreateContributions);
router.get("/:id/receipt", (0, rbacMiddleware_1.checkPermission)("contribution:receipt"), contributionController_1.contributionController.generateDonorReceipt);
router.get("/:id/receipt.pdf", (0, rbacMiddleware_1.checkPermission)("contribution:receipt"), contributionController_1.contributionController.downloadDonorReceiptPdf);
exports.default = router;
//# sourceMappingURL=contributionRoutes.js.map