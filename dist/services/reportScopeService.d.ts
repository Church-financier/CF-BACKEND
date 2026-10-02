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
export declare const ORGANIZATION_SCOPE: ReportScope;
/** Only `DEPARTMENT_HEAD` gets a restricted scope. */
export declare function isDepartmentScopedRole(role: string | undefined | null): boolean;
/**
 * Build the scope for a caller. A department head who heads no department
 * gets an explicitly empty scope, so they see nothing rather than everything.
 */
export declare function resolveReportScope(user: {
    id: string;
    role?: string | null;
} | undefined | null, organizationId: string): Promise<ReportScope>;
/**
 * Constrain a caller-supplied fund selection to the funds in scope.
 *
 * A department head can still narrow a report to one of their own funds from
 * the UI, but they cannot widen it by passing an arbitrary fund id, because
 * anything outside their scope is dropped. An organization-wide caller keeps
 * exactly what they asked for.
 */
export declare function constrainFundIds(requested: string[] | undefined, scope: ReportScope): string[] | undefined;
/**
 * Resolve the department a caller may report on. Organization-wide callers get
 * whatever they requested; a department head always gets their own department.
 */
export declare function constrainDepartmentId(requested: string | undefined, scope: ReportScope): string | undefined;
//# sourceMappingURL=reportScopeService.d.ts.map