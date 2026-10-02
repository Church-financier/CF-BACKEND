import { Router } from "express";
import { journalController } from "../controllers/journalController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { requireIdempotencyKey } from "../middleware/idempotencyMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createJournalEntrySchema, reverseJournalEntrySchema, paginationQuerySchema } from "../schemas";

const router = Router();

// Journal posting is the general-ledger write path, so it is replay-protected
// as well: a retried post must not duplicate the double entry.
router.use(requireIdempotencyKey());

router.get("/", checkPermission("ledger:read"), validateQuery(paginationQuerySchema), journalController.listJournalEntries);
router.post("/", checkPermission("ledger:create"), validateBody(createJournalEntrySchema), journalController.createJournalEntry);
router.patch("/:id/reverse", checkPermission("ledger:reverse"), validateBody(reverseJournalEntrySchema), journalController.reverseJournalEntry);

export default router;
