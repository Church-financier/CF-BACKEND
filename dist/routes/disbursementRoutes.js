"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller = __importStar(require("../controllers/disbursementController"));
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const idempotencyMiddleware_1 = require("../middleware/idempotencyMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Requisition creation, approvals, payout and cancellation all move money, so
// they are replay-protected: the same X-Idempotency-Key can never pay twice.
router.use((0, idempotencyMiddleware_1.requireIdempotencyKey)());
router.get("/", (0, rbacMiddleware_1.checkPermission)("disbursement:read"), (0, validationMiddleware_1.validateQuery)(schemas_1.paginationQuerySchema), controller.listDisbursementRequests);
router.get("/:id", (0, rbacMiddleware_1.checkPermission)("disbursement:read"), controller.getDisbursementRequest);
router.get("/:id/voucher", (0, rbacMiddleware_1.checkPermission)("disbursement:read"), controller.downloadPaymentVoucher);
// Same voucher data as JSON, for the in-app print preview.
router.get("/:id/voucher.json", (0, rbacMiddleware_1.checkPermission)("disbursement:read"), controller.getPaymentVoucher);
router.post("/", (0, rbacMiddleware_1.checkPermission)("disbursement:create"), (0, validationMiddleware_1.validateBody)(schemas_1.createDisbursementSchema), controller.createDisbursementRequest);
// Both approval stages belong to the finance roles. The service still enforces
// dual control: the same person cannot occupy both stages.
router.patch("/:id/first-approve", (0, authMiddleware_1.requireRole)("SUPER_ADMIN", "TREASURER"), (0, rbacMiddleware_1.checkPermission)("disbursement:approve"), controller.firstApproveDisbursement);
router.patch("/:id/second-approve", (0, authMiddleware_1.requireRole)("SUPER_ADMIN", "TREASURER"), (0, rbacMiddleware_1.checkPermission)("disbursement:approve"), controller.secondApproveDisbursement);
router.patch("/:id/reject", (0, rbacMiddleware_1.checkPermission)("disbursement:reject"), (0, validationMiddleware_1.validateBody)(schemas_1.rejectDisbursementSchema), controller.rejectDisbursement);
router.patch("/:id/mark-paid", (0, authMiddleware_1.requireRole)("SUPER_ADMIN", "TREASURER"), (0, rbacMiddleware_1.checkPermission)("disbursement:approve"), (0, validationMiddleware_1.validateBody)(schemas_1.markPaidSchema), controller.markDisbursementPaid);
router.patch("/:id/cancel", (0, authMiddleware_1.requireRole)("SUPER_ADMIN"), (0, rbacMiddleware_1.checkPermission)("disbursement:reject"), (0, validationMiddleware_1.validateBody)(schemas_1.cancelDisbursementSchema), controller.cancelDisbursement);
exports.default = router;
//# sourceMappingURL=disbursementRoutes.js.map