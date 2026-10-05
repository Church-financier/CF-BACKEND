"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAnyPermission = exports.checkPermission = void 0;
const PERMISSIONS = {
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
        const userPermissions = PERMISSIONS[req.user.role] || [];
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
        const userPermissions = PERMISSIONS[req.user.role] || [];
        if (!permissions.some((permission) => userPermissions.includes(permission))) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
};
exports.checkAnyPermission = checkAnyPermission;
//# sourceMappingURL=rbacMiddleware.js.map