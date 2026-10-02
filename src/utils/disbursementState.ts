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
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["FIRST_APPROVED", "REJECTED", "CANCELLED"],
  FIRST_APPROVED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["PAID", "CANCELLED"],
  PAID: ["CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
};

export const TERMINAL_DISBURSEMENT_STATUSES = ["PAID", "REJECTED", "CANCELLED"];

export function isTerminalDisbursementStatus(status: string): boolean {
  return TERMINAL_DISBURSEMENT_STATUSES.includes(status);
}

export function canTransitionDisbursement(from: string, to: string): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}
