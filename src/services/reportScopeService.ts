import { prisma } from "../lib/prisma";

/**
 * Resolves which slice of the organization's financial data a caller may see.
 *
 * Every financial report is either organization-wide or department-scoped.
 * A DEPARTMENT_HEAD is always scoped: `departmentIds` lists the departments
 * they head, and `fundIds` the funds those departments are budgeted against.
 *
 * An **empty `fundIds` array is meaningful** and means "this department has no
 * funds allocated, so it has no reportable figures". Services must therefore
 * apply a fund filter whenever `fundIds` is defined, including when it is
 * empty, rather than treating an empty list as "no filter". That distinction
 * is what stops a department head with no budget allocations from falling back
 * to organization-wide totals.
 */
export interface ReportScope {
  /** Departments in scope, or `undefined` for organization-wide access. */
  departmentIds: string[] | undefined;
  /** Funds in scope. `undefined` means all funds; `[]` means no funds. */
  fundIds: string[] | undefined;
  /** Names of the scoped departments, for report metadata and UI labels. */
  departmentNames: string[];
}

/** Organization-wide scope: every department and every fund. */
export const ORGANIZATION_SCOPE: ReportScope = {
  departmentIds: undefined,
  fundIds: undefined,
  departmentNames: [],
};

/** Only `DEPARTMENT_HEAD` gets a restricted scope. */
export function isDepartmentScopedRole(role: string | undefined | null): boolean {
  return role === "DEPARTMENT_HEAD";
}

/**
 * Build the scope for a caller. A department head who heads no department
 * gets an explicitly empty scope, so they see nothing rather than everything.
 */
export async function resolveReportScope(
  user: { id: string; role?: string | null } | undefined | null,
  organizationId: string
): Promise<ReportScope> {
  if (!user || !isDepartmentScopedRole(user.role)) return ORGANIZATION_SCOPE;

  const departments = await prisma.department.findMany({
    where: { headId: user.id, organizationId },
    select: { id: true, name: true },
  });

  if (departments.length === 0) {
    return { departmentIds: [], fundIds: [], departmentNames: [] };
  }

  const departmentIds = departments.map((department) => department.id);
  const budgets = await prisma.budget.findMany({
    where: { organizationId, departmentId: { in: departmentIds } },
    select: { fundId: true },
  });

  return {
    departmentIds,
    fundIds: [...new Set(budgets.map((budget) => budget.fundId))],
    departmentNames: departments.map((department) => department.name),
  };
}

/**
 * Constrain a caller-supplied fund selection to the funds in scope.
 *
 * A department head can still narrow a report to one of their own funds from
 * the UI, but they cannot widen it by passing an arbitrary fund id, because
 * anything outside their scope is dropped. An organization-wide caller keeps
 * exactly what they asked for.
 */
export function constrainFundIds(
  requested: string[] | undefined,
  scope: ReportScope
): string[] | undefined {
  if (scope.fundIds === undefined) return requested;
  if (requested === undefined || requested.length === 0) return scope.fundIds;
  return requested.filter((fundId) => scope.fundIds!.includes(fundId));
}

/**
 * Resolve the department a caller may report on. Organization-wide callers get
 * whatever they requested; a department head always gets their own department.
 */
export function constrainDepartmentId(
  requested: string | undefined,
  scope: ReportScope
): string | undefined {
  if (scope.departmentIds === undefined) return requested;
  if (scope.departmentIds.length === 0) return undefined;
  if (!requested) return scope.departmentIds[0];
  return scope.departmentIds.includes(requested) ? requested : scope.departmentIds[0];
}