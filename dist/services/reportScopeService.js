"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORGANIZATION_SCOPE = void 0;
exports.isDepartmentScopedRole = isDepartmentScopedRole;
exports.resolveReportScope = resolveReportScope;
exports.constrainFundIds = constrainFundIds;
exports.constrainDepartmentId = constrainDepartmentId;
const prisma_1 = require("../lib/prisma");
/** Organization-wide scope: every department and every fund. */
exports.ORGANIZATION_SCOPE = {
    departmentIds: undefined,
    fundIds: undefined,
    departmentNames: [],
};
/** Only `DEPARTMENT_HEAD` gets a restricted scope. */
function isDepartmentScopedRole(role) {
    return role === "DEPARTMENT_HEAD";
}
/**
 * Build the scope for a caller. A department head who heads no department
 * gets an explicitly empty scope, so they see nothing rather than everything.
 */
async function resolveReportScope(user, organizationId) {
    if (!user || !isDepartmentScopedRole(user.role))
        return exports.ORGANIZATION_SCOPE;
    const departments = await prisma_1.prisma.department.findMany({
        where: { headId: user.id, organizationId },
        select: { id: true, name: true },
    });
    if (departments.length === 0) {
        return { departmentIds: [], fundIds: [], departmentNames: [] };
    }
    const departmentIds = departments.map((department) => department.id);
    const budgets = await prisma_1.prisma.budget.findMany({
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
function constrainFundIds(requested, scope) {
    if (scope.fundIds === undefined)
        return requested;
    if (requested === undefined || requested.length === 0)
        return scope.fundIds;
    return requested.filter((fundId) => scope.fundIds.includes(fundId));
}
/**
 * Resolve the department a caller may report on. Organization-wide callers get
 * whatever they requested; a department head always gets their own department.
 */
function constrainDepartmentId(requested, scope) {
    if (scope.departmentIds === undefined)
        return requested;
    if (scope.departmentIds.length === 0)
        return undefined;
    if (!requested)
        return scope.departmentIds[0];
    return scope.departmentIds.includes(requested) ? requested : scope.departmentIds[0];
}
//# sourceMappingURL=reportScopeService.js.map