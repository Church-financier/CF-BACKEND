import { Router } from "express";
import * as controller from "../controllers/disbursementController";
import { checkPermission } from "../middleware/rbacMiddleware";
import { requireIdempotencyKey } from "../middleware/idempotencyMiddleware";
import { requireRole } from "../middleware/authMiddleware";
import { validateBody, validateQuery } from "../middleware/validationMiddleware";
import { createDisbursementSchema, paginationQuerySchema, rejectDisbursementSchema, markPaidSchema, cancelDisbursementSchema } from "../schemas";

const router = Router();

// Requisition creation, approvals, payout and cancellation all move money, so
// they are replay-protected: the same X-Idempotency-Key can never pay twice.
router.use(requireIdempotencyKey());

router.get("/", checkPermission("disbursement:read"), validateQuery(paginationQuerySchema), controller.listDisbursementRequests);
router.get("/:id", checkPermission("disbursement:read"), controller.getDisbursementRequest);
router.get("/:id/voucher", checkPermission("disbursement:read"), controller.downloadPaymentVoucher);
// Same voucher data as JSON, for the in-app print preview.
router.get("/:id/voucher.json", checkPermission("disbursement:read"), controller.getPaymentVoucher);
router.post("/", checkPermission("disbursement:create"), validateBody(createDisbursementSchema), controller.createDisbursementRequest);
// Both approval stages belong to the finance roles. The service still enforces
// dual control: the same person cannot occupy both stages.
router.patch("/:id/first-approve", requireRole("SUPER_ADMIN", "TREASURER"), checkPermission("disbursement:approve"), controller.firstApproveDisbursement);
router.patch("/:id/second-approve", requireRole("SUPER_ADMIN", "TREASURER"), checkPermission("disbursement:approve"), controller.secondApproveDisbursement);
router.patch("/:id/reject", checkPermission("disbursement:reject"), validateBody(rejectDisbursementSchema), controller.rejectDisbursement);
router.patch("/:id/mark-paid", requireRole("SUPER_ADMIN", "TREASURER"), checkPermission("disbursement:approve"), validateBody(markPaidSchema), controller.markDisbursementPaid);
router.patch("/:id/cancel", requireRole("SUPER_ADMIN"), checkPermission("disbursement:reject"), validateBody(cancelDisbursementSchema), controller.cancelDisbursement);

export default router;
