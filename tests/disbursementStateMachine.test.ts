import { describe, it, expect } from "vitest";
import {
  canTransitionDisbursement,
  isTerminalDisbursementStatus,
  TERMINAL_DISBURSEMENT_STATUSES,
} from "../src/utils/disbursementState";

/**
 * The disbursement state machine is the guard that stops a retried click from
 * paying a requisition twice, so it is asserted directly.
 */
describe("disbursement state machine", () => {
  it("follows the happy path PENDING -> FIRST_APPROVED -> APPROVED -> PAID", () => {
    expect(canTransitionDisbursement("PENDING", "FIRST_APPROVED")).toBe(true);
    expect(canTransitionDisbursement("FIRST_APPROVED", "APPROVED")).toBe(true);
    expect(canTransitionDisbursement("APPROVED", "PAID")).toBe(true);
  });

  it("refuses to skip an approval stage", () => {
    expect(canTransitionDisbursement("PENDING", "APPROVED")).toBe(false);
    expect(canTransitionDisbursement("PENDING", "PAID")).toBe(false);
    expect(canTransitionDisbursement("FIRST_APPROVED", "PAID")).toBe(false);
  });

  it("treats PAID, REJECTED and CANCELLED as terminal", () => {
    for (const status of TERMINAL_DISBURSEMENT_STATUSES) {
      expect(isTerminalDisbursementStatus(status)).toBe(true);
    }
    expect(TERMINAL_DISBURSEMENT_STATUSES).toEqual(["PAID", "REJECTED", "CANCELLED"]);
  });

  it("never processes a terminal disbursement a second time", () => {
    expect(canTransitionDisbursement("PAID", "PAID")).toBe(false);
    expect(canTransitionDisbursement("PAID", "APPROVED")).toBe(false);
    expect(canTransitionDisbursement("PAID", "FIRST_APPROVED")).toBe(false);
    expect(canTransitionDisbursement("PAID", "REJECTED")).toBe(false);
    // A paid disbursement can only be undone as a storno.
    expect(canTransitionDisbursement("PAID", "CANCELLED")).toBe(true);
  });

  it("leaves a rejected or cancelled disbursement immutable", () => {
    expect(canTransitionDisbursement("REJECTED", "FIRST_APPROVED")).toBe(false);
    expect(canTransitionDisbursement("REJECTED", "APPROVED")).toBe(false);
    expect(canTransitionDisbursement("REJECTED", "PAID")).toBe(false);
    expect(canTransitionDisbursement("CANCELLED", "APPROVED")).toBe(false);
    expect(canTransitionDisbursement("CANCELLED", "PAID")).toBe(false);
  });

  it("allows rejection only before the final approval", () => {
    expect(canTransitionDisbursement("PENDING", "REJECTED")).toBe(true);
    expect(canTransitionDisbursement("FIRST_APPROVED", "REJECTED")).toBe(true);
    // Once approved the request is cancelled, not rejected.
    expect(canTransitionDisbursement("APPROVED", "REJECTED")).toBe(false);
  });

  it("allows cancellation from every non-terminal stage, and as a storno once paid", () => {
    for (const status of ["PENDING", "FIRST_APPROVED", "APPROVED", "PAID"]) {
      expect(canTransitionDisbursement(status, "CANCELLED")).toBe(true);
    }
    expect(canTransitionDisbursement("REJECTED", "CANCELLED")).toBe(false);
    expect(canTransitionDisbursement("CANCELLED", "CANCELLED")).toBe(false);
  });

  it("rejects an unknown source status rather than defaulting to allowed", () => {
    expect(canTransitionDisbursement("NOT_A_STATUS", "APPROVED")).toBe(false);
    expect(isTerminalDisbursementStatus("NOT_A_STATUS")).toBe(false);
  });
});
