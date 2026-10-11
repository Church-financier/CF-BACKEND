"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.denyRoleWrites = exports.checkAnyPermission = exports.checkPermission = exports.PERMISSIONS = exports.READ_ONLY_ROLES = exports.WRITE_METHODS = void 0;
exports.isReadOnlyRole = isReadOnlyRole;
/** HTTP verbs that mutate state. Anything an auditor may never invoke. */
exports.WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
/**
 * Roles that are strictly view-only application-wide.
 *
 * The auditor exists to verify records, so it holds read permissions only and
 * must never be able to create, update or delete anything. The UI hides the
 * corresponding controls; `denyRoleWrites` below enforces the same rule at the
 * API so a hand-crafted request cannot get around the hidden buttons.
 */
exports.READ_ONLY_ROLES = ["AUDITOR"];
function isReadOnlyRole(role) {
    return !!role && exports.READ_ONLY_ROLES.includes(role);
}
exports.PERMISSIONS = {
    SUPER_ADMIN: [
        "fund:create", "fund:read", "fund:update", "fund:delete",
        "ledger:create", "ledger:read", "ledger:reverse",
        "disbursement:create", "disbursement:read", "disbursement:approve", "disbursement:reject",
        "report:export", "report:read", "report:income",
        "user:manage",
        "audit:read",
        "pledge:create", "pledge:read", "pledge:update", "pledge:delete",
        "contribution:read", "contribution:batch", "contribution:create", "contribution:update", "contribution:delete", "contribution:receipt",
        "chart-of-accounts:create", "chart-of-accounts:read", "chart-of-accounts:update", "chart-of-accounts:delete",
        "vendor:create", "vendor:read", "vendor:update", "vendor:delete",
        "department:create", "department:read", "department:update", "department:delete",
        "member:create", "member:read", "member:update", "member:delete",
        "budget:create", "budget:read", "budget:update", "budget:delete",
    ],
    TREASURER: [
        "fund:create", "fund:read", "fund:update", "fund:delete",
        "ledger:read",
        "disbursement:create", "disbursement:read", "disbursement:approve", "disbursement:reject",
        "chart-of-accounts:create", "chart-of-accounts:read", "chart-of-accounts:update", "chart-of-accounts:delete",
        "budget:create", "budget:read", "budget:update", "budget:delete",
        "report:read", "report:export",
        "vendor:create", "vendor:read", "vendor:update", "vendor:delete",
        // Read-only: the budget builder, master budget and disbursement forms all
        // need the department directory to populate their selectors.
        "department:read",
        "member:create", "member:read", "member:update", "member:delete",
        "contribution:read", "contribution:batch", "contribution:create", "contribution:update", "contribution:delete", "contribution:receipt",
        "pledge:create", "pledge:read", "pledge:update", "pledge:delete",
    ],
    FINANCIAL_SECRETARY: [
        "member:create", "member:read", "member:update", "member:delete",
        "contribution:read", "contribution:batch", "contribution:create", "contribution:update", "contribution:delete", "contribution:receipt",
        "pledge:create", "pledge:read", "pledge:update", "pledge:delete",
        "vendor:read",
        "report:income",
    ],
    AUDITOR: [
        // Read-only. Exporting a financial statement is a read of stored data, so
        // the auditor keeps report:read / report:export / report:income, but no
        // verb in this list may create, update or delete anything.
        "fund:read",
        "ledger:read",
        "disbursement:read",
        "report:read", "report:export", "report:income",
        "member:read",
        "contribution:read", "contribution:receipt",
        "pledge:read",
        "chart-of-accounts:read",
        "budget:read",
        "vendor:read",
        "department:read",
        "audit:read",
    ],
    DEPARTMENT_HEAD: [
        "disbursement:create",
        "disbursement:read",
        "budget:create", "budget:read", "budget:update",
        "report:read",
        "department:read",
    ],
};
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const userPermissions = exports.PERMISSIONS[req.user.role] || [];
        if (!userPermissions.includes(permission)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
};
exports.checkPermission = checkPermission;
const checkAnyPermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const userPermissions = exports.PERMISSIONS[req.user.role] || [];
        if (!permissions.some((permission) => userPermissions.includes(permission))) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
};
exports.checkAnyPermission = checkAnyPermission;
/**
 * Application-wide belt-and-braces guard for read-only roles.
 *
 * Mount immediately after `tenantScoped` on the tenant API router so it runs
 * before every resource router. Any state-changing verb from a read-only role
 * is rejected with 403 before it can reach a controller, which closes routes
 * that rely on per-route `checkPermission` alone (or that were missed).
 *
 * Reads, including report export, are untouched.
 */
const denyRoleWrites = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }
    if (!isReadOnlyRole(req.user.role)) {
        return next();
    }
    const method = req.method.toUpperCase();
    if (!exports.WRITE_METHODS.includes(method)) {
        return next();
    }
    return res.status(403).json({
        error: "Insufficient permissions",
        message: "The Auditor role is view-only and cannot modify records.",
    });
};
exports.denyRoleWrites = denyRoleWrites;
//# sourceMappingURL=rbacMiddleware.js.map