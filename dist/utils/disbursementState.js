"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TERMINAL_DISBURSEMENT_STATUSES = void 0;
exports.isTerminalDisbursementStatus = isTerminalDisbursementStatus;
exports.canTransitionDisbursement = canTransitionDisbursement;
/**
 * Disbursement state machine.
 *
 * PAID, REJECTED and CANCELLED are terminal for their own action: a paid
 * requisition cannot be approved or rejected again, and a rejected or
 * cancelled one cannot be reactivated. This is what stops a retried or
 * double-clicked request from paying the same requisition twice.
 *
 * Kept in its own module (rather than inside the service) so the guard can be
 * unit tested without booting the API server.
 */
const ALLOWED_TRANSITIONS = {
    PENDING: ["FIRST_APPROVED", "REJECTED", "CANCELLED"],
    FIRST_APPROVED: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: ["PAID", "CANCELLED"],
    PAID: ["CANCELLED"],
    REJECTED: [],
    CANCELLED: [],
};
exports.TERMINAL_DISBURSEMENT_STATUSES = ["PAID", "REJECTED", "CANCELLED"];
function isTerminalDisbursementStatus(status) {
    return exports.TERMINAL_DISBURSEMENT_STATUSES.includes(status);
}
function canTransitionDisbursement(from, to) {
    return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}
//# sourceMappingURL=disbursementState.js.map