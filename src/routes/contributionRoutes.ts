import { Router } from "express";
import { contributionController } from "../controllers/contributionController";
import { checkAnyPermission, checkPermission } from "../middleware/rbacMiddleware";
import { requireIdempotencyKey } from "../middleware/idempotencyMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { batchEntrySchema, deleteContributionSchema, paginationQuerySchema, singleContributionSchema, updateContributionSchema } from "../schemas";

const router = Router();

// Every contribution write is replay-protected: a double-clicked or retried
// submission must not post a second ledger entry.
router.use(requireIdempotencyKey());

router.get("/funds", checkAnyPermission("fund:read", "contribution:read", "pledge:read"), contributionController.listContributionFunds);
router.get("/member/:memberId/statement", checkPermission("contribution:read"), contributionController.getMemberStatement);
router.get("/", checkPermission("contribution:read"), validateQuery(paginationQuerySchema), contributionController.listContributions);
router.get("/:id", checkPermission("contribution:read"), contributionController.getContribution);
router.patch("/:id", checkPermission("contribution:update"), validateBody(updateContributionSchema), contributionController.updateContribution);
router.delete("/:id", checkPermission("contribution:delete"), validateBody(deleteContributionSchema), contributionController.deleteContribution);
router.post("/", checkPermission("contribution:create"), validateBody(singleContributionSchema), contributionController.createSingleContribution);
router.post("/batch", checkPermission("contribution:create"), validateBody(batchEntrySchema), contributionController.batchCreateContributions);
router.get("/:id/receipt", checkPermission("contribution:receipt"), contributionController.generateDonorReceipt);
router.get("/:id/receipt.pdf", checkPermission("contribution:receipt"), contributionController.downloadDonorReceiptPdf);

export default router;
