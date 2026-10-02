import { describe, it, expect } from "vitest";
import type { ReportScope } from "../src/services/reportScopeService";
import { constrainDepartmentId, constrainFundIds, ORGANIZATION_SCOPE } from "../src/services/reportScopeService";

const scope = (
  departmentIds: string[] | undefined,
  fundIds: string[] | undefined,
  departmentNames: string[] = []
): ReportScope => ({ departmentIds, fundIds, departmentNames });

describe("organization-wide scope", () => {
  it("leaves an unconstrained request untouched", () => {
    expect(constrainFundIds(["a", "b"], ORGANIZATION_SCOPE)).toEqual(["a", "b"]);
    expect(constrainFundIds(undefined, ORGANIZATION_SCOPE)).toBeUndefined();
  });

  it("honours a requested department as-is", () => {
    expect(constrainDepartmentId("dept-9", ORGANIZATION_SCOPE)).toBe("dept-9");
    expect(constrainDepartmentId(undefined, ORGANIZATION_SCOPE)).toBeUndefined();
  });
});

describe("department-scoped funds", () => {
  const departmentScope = scope(["dept-1"], ["fund-1", "fund-2"]);

  it("defaults to every fund in scope when none is requested", () => {
    expect(constrainFundIds(undefined, departmentScope)).toEqual(["fund-1", "fund-2"]);
    expect(constrainFundIds([], departmentScope)).toEqual(["fund-1", "fund-2"]);
  });

  it("keeps a requested fund that belongs to the department", () => {
    expect(constrainFundIds(["fund-2"], departmentScope)).toEqual(["fund-2"]);
  });

  it("drops a fund the department does not own", () => {
    expect(constrainFundIds(["fund-9"], departmentScope)).toEqual([]);
    expect(constrainFundIds(["fund-2", "fund-9"], departmentScope)).toEqual(["fund-2"]);
  });

  it("returns an empty list, not everything, when the department has no funds", () => {
    const noFunds = scope(["dept-1"], []);
    expect(constrainFundIds(undefined, noFunds)).toEqual([]);
    expect(constrainFundIds(["fund-1"], noFunds)).toEqual([]);
  });
});

describe("department-scoped departments", () => {
  it("defaults to the first department in scope", () => {
    expect(constrainDepartmentId(undefined, scope(["dept-1", "dept-2"], ["fund-1"]))).toBe("dept-1");
  });

  it("keeps a requested department the user heads", () => {
    expect(constrainDepartmentId("dept-2", scope(["dept-1", "dept-2"], ["fund-1"]))).toBe("dept-2");
  });

  it("redirects a request for a department the user does not head", () => {
    expect(constrainDepartmentId("dept-99", scope(["dept-1"], ["fund-1"]))).toBe("dept-1");
  });

  it("has no department to fall back on when the user heads none", () => {
    expect(constrainDepartmentId(undefined, scope([], []))).toBeUndefined();
    expect(constrainDepartmentId("dept-1", scope([], []))).toBeUndefined();
  });
});