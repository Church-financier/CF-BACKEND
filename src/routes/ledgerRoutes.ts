import { Router } from "express";
import { ledgerController } from "../controllers/ledgerController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { requireIdempotencyKey } from "../middleware/idempotencyMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createLedgerEntrySchema, reverseLedgerEntrySchema, paginationQuerySchema } from "../schemas";

const router = Router();

// General ledger transactions and reversals are replay-protected.
router.use(requireIdempotencyKey());

router.get("/", checkPermission("ledger:read"), validateQuery(paginationQuerySchema), ledgerController.listLedgerEntries);
router.get("/:id", checkPermission("ledger:read"), ledgerController.getLedgerEntry);
router.post("/", checkPermission("ledger:create"), validateBody(createLedgerEntrySchema), ledgerController.createLedgerEntry);
router.patch("/:id/reverse", checkPermission("ledger:reverse"), validateBody(reverseLedgerEntrySchema), ledgerController.reverseLedgerEntry);

export default router;