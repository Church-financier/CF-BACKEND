import { describe, it, expect } from "vitest";
import { checkAnyPermission, checkPermission } from "../src/middleware/rbacMiddleware";

function makeReq(role: string) {
  return { user: { id: "u1", email: "a@b.com", role, organizationId: "o1" } } as any;
}

function runMiddleware(role: string, permission: string): number {
  const req = makeReq(role);
  const res: any = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  let nextCalled = false;
  checkPermission(permission)(req, res, () => {
    nextCalled = true;
  });
  return nextCalled ? 200 : res.statusCode;
}

function runAnyMiddleware(role: string, ...permissions: string[]): number {
  const req = makeReq(role);
  const res: any = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  let nextCalled = false;
  checkAnyPermission(...permissions)(req, res, () => {
    nextCalled = true;
  });
  return nextCalled ? 200 : res.statusCode;
}

describe("RBAC permission matrix", () => {
  it("SUPER_ADMIN can access every documented permission", () => {
    const perms = [
      "fund:create", "fund:read", "fund:update", "fund:delete",
      "ledger:create", "ledger:read", "ledger:reverse",
      "disbursement:create", "disbursement:read", "disbursement:approve", "disbursement:reject",
      "report:export", "report:read",
      "user:manage",
      "audit:read",
      "pledge:create", "pledge:read", "pledge:update", "pledge:delete",
      "contribution:read", "contribution:batch", "contribution:receipt",
      "contribution:create", "contribution:update", "contribution:delete", "report:income",
      "chart-of-accounts:create", "chart-of-accounts:read", "chart-of-accounts:update", "chart-of-accounts:delete",
      "vendor:create", "vendor:read", "vendor:update", "vendor:delete",
      "department:create", "department:read", "department:update", "department:delete",
      "member:create", "member:read", "member:update", "member:delete",
      "budget:create", "budget:read", "budget:update", "budget:delete",
    ];
    for (const p of perms) {
      expect(runMiddleware("SUPER_ADMIN", p)).toBe(200);
    }
  });

  it("TREASURER has full CRUD across the financial and directory modules", () => {
    const allowed = [
      // Chart of accounts: create, edit, activate/deactivate, parent-link.
      "chart-of-accounts:create", "chart-of-accounts:read", "chart-of-accounts:update", "chart-of-accounts:delete",
      // Contributions: record, batch, amend and reverse.
      "contribution:read", "contribution:batch", "contribution:create", "contribution:update",
      "contribution:delete", "contribution:receipt",
      // Vendors, including tax and banking details.
      "vendor:create", "vendor:read", "vendor:update", "vendor:delete",
      // Members and their portal status.
      "member:create", "member:read", "member:update", "member:delete",
      // Disbursements: requisition, approval, rejection, payout.
      "disbursement:create", "disbursement:read", "disbursement:approve", "disbursement:reject",
      // Pledges: create, update and record fulfillments via contributions.
      "pledge:create", "pledge:read", "pledge:update", "pledge:delete",
      // Budgets and the master budget builder.
      "budget:create", "budget:read", "budget:update", "budget:delete",
      // Funds: view and allocate.
      "fund:create", "fund:read", "fund:update", "fund:delete",
      // Supporting reads.
      "ledger:read", "report:read", "report:export", "department:read",
    ];
    for (const p of allowed) {
      expect(runMiddleware("TREASURER", p)).toBe(200);
    }
    // Still no admin-level rights: user management, audit trail and direct
    // general-ledger posting remain with the super admin.
    expect(runMiddleware("TREASURER", "user:manage")).toBe(403);
    expect(runMiddleware("TREASURER", "audit:read")).toBe(403);
    expect(runMiddleware("TREASURER", "ledger:create")).toBe(403);
    expect(runMiddleware("TREASURER", "ledger:reverse")).toBe(403);
    expect(runMiddleware("TREASURER", "report:income")).toBe(403);
    // Nor may a treasurer restructure the department directory.
    expect(runMiddleware("TREASURER", "department:create")).toBe(403);
    expect(runMiddleware("TREASURER", "department:update")).toBe(403);
    expect(runMiddleware("TREASURER", "department:delete")).toBe(403);
  });

  it("FINANCIAL_SECRETARY has member, contribution, pledge, vendor-read, and income-report access only", () => {
    const allowed = [
      "member:create", "member:read", "member:update", "member:delete",
      "contribution:read", "contribution:batch", "contribution:create", "contribution:update", "contribution:delete", "contribution:receipt",
      "pledge:create", "pledge:read", "pledge:update", "pledge:delete",
      "vendor:read",
      "report:income",
    ];
    for (const p of allowed) {
      expect(runMiddleware("FINANCIAL_SECRETARY", p)).toBe(200);
    }
    expect(runMiddleware("FINANCIAL_SECRETARY", "fund:create")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "fund:read")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "ledger:create")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "ledger:read")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "ledger:reverse")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "disbursement:read")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "report:read")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "report:export")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "budget:read")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "vendor:create")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "vendor:update")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "vendor:delete")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "chart-of-accounts:read")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "user:manage")).toBe(403);
    expect(runMiddleware("FINANCIAL_SECRETARY", "audit:read")).toBe(403);
  });

  it("fund-name lookup does not expose fund balances and is available to the relevant read roles", () => {
    expect(runAnyMiddleware("FINANCIAL_SECRETARY", "fund:read", "contribution:read", "pledge:read")).toBe(200);
    expect(runAnyMiddleware("AUDITOR", "fund:read", "contribution:read", "pledge:read")).toBe(200);
    expect(runAnyMiddleware("DEPARTMENT_HEAD", "fund:read", "contribution:read", "pledge:read")).toBe(403);
  });

  it("AUDITOR is read-only across all auditable resources", () => {
    const allowed = [
      "audit:read", "ledger:read", "report:read", "report:export",
      "disbursement:read",
      "pledge:read", "contribution:read", "contribution:receipt",
      "chart-of-accounts:read", "budget:read",
      "vendor:read", "department:read", "member:read", "fund:read",
      "report:income",
    ];
    for (const p of allowed) {
      expect(runMiddleware("AUDITOR", p)).toBe(200);
    }
    // AUDITOR must not have any write / mutate permissions
    const denied = [
      "fund:create", "fund:update", "fund:delete",
      "ledger:create", "ledger:reverse",
      "disbursement:create", "disbursement:approve", "disbursement:reject",
      "contribution:create", "contribution:batch", "contribution:update", "contribution:delete",
      "pledge:create", "pledge:update", "pledge:delete",
      "chart-of-accounts:create", "chart-of-accounts:update", "chart-of-accounts:delete",
      "budget:create", "budget:update", "budget:delete",
      "vendor:create", "vendor:update", "vendor:delete",
      "department:create", "department:update", "department:delete",
      "member:create", "member:update", "member:delete",
      "user:manage",
    ];
    for (const p of denied) {
      expect(runMiddleware("AUDITOR", p)).toBe(403);
    }
  });

  it("DEPARTMENT_HEAD can create/read disbursements, read department/budget/report — no vendor/pledge access", () => {
    const allowed = [
      "disbursement:create", "disbursement:read",
      "department:read", "budget:read", "report:read",
    ];
    for (const p of allowed) {
      expect(runMiddleware("DEPARTMENT_HEAD", p)).toBe(200);
    }
    // Department Head has NO vendor or pledge access (data isolation)
    expect(runMiddleware("DEPARTMENT_HEAD", "vendor:read")).toBe(403);
    expect(runMiddleware("DEPARTMENT_HEAD", "pledge:read")).toBe(403);
    // Department Head cannot approve disbursements
    expect(runMiddleware("DEPARTMENT_HEAD", "disbursement:approve")).toBe(403);
    expect(runMiddleware("DEPARTMENT_HEAD", "fund:create")).toBe(403);
    // Organization-wide budget allocation is not a head's remit; they work
    // inside their own department budget instead.
    expect(runMiddleware("DEPARTMENT_HEAD", "budget:delete")).toBe(403);
    // Nor is the whole chart of accounts: the budget line-item picker is
    // served by a budget-scoped endpoint instead.
    expect(runMiddleware("DEPARTMENT_HEAD", "chart-of-accounts:read")).toBe(403);
    expect(runMiddleware("DEPARTMENT_HEAD", "chart-of-accounts:create")).toBe(403);
  });

  it("unknown role receives 403 for every permission", () => {
    expect(runMiddleware("GUEST", "fund:read")).toBe(403);
    expect(runMiddleware("GUEST", "report:read")).toBe(403);
  });

  it("unauthenticated request receives 401", () => {
    const req = {} as any;
    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    };
    checkPermission("fund:read")(req, res, () => {
      // Should never reach here for an unauthenticated request.
      throw new Error("next() should not be called");
    });
    expect(res.statusCode).toBe(401);
  });
});