"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const prisma_1 = require("../lib/prisma");
const documentCurrency_1 = require("../utils/documentCurrency");
const RESOURCE_SINGULAR = {
    funds: "Fund",
    "chart-of-accounts": "Chart Of Account",
    pledges: "Pledge",
    contributions: "Contribution",
    vendors: "Vendor",
    disbursements: "Disbursement Request",
    users: "User",
    departments: "Department",
    budgets: "Budget",
    members: "Member",
    "ledger-entries": "Ledger Entry",
    "journal-entries": "Journal Entry",
    periods: "Period",
};
const toTitleCase = (str) => str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const singularizeResource = (resource) => {
    const lower = resource.toLowerCase();
    if (RESOURCE_SINGULAR[lower])
        return RESOURCE_SINGULAR[lower];
    if (lower.endsWith("ies"))
        return lower.slice(0, -3) + "y";
    if (lower.endsWith("ses") || lower.endsWith("xes") || lower.endsWith("zes"))
        return lower.slice(0, -2);
    if (lower.endsWith("s") && !lower.endsWith("ss"))
        return lower.slice(0, -1);
    return resource;
};
const describeHttpLog = (details, currency) => {
    const path = typeof details.path === "string" ? details.path : "";
    const method = typeof details.method === "string" ? details.method : "";
    const body = (details.body && typeof details.body === "object") ? details.body : {};
    const segments = path.replace(/^\/api\//, "").split("/").filter(Boolean);
    const rawResource = segments[0] || "";
    const resource = singularizeResource(toTitleCase(rawResource));
    const actionWord = (() => {
        if (method === "POST")
            return "Created";
        if (method === "PATCH" || method === "PUT") {
            if (path.includes("approve"))
                return "Approved";
            if (path.includes("reject"))
                return "Rejected";
            if (path.includes("reverse"))
                return "Reversed";
            if (path.includes("cancel"))
                return "Cancelled";
            if (path.includes("mark-paid"))
                return "Marked as paid";
            if (path.includes("first-approve"))
                return "First approved";
            if (path.includes("second-approve"))
                return "Second approved";
            if (path.includes("role"))
                return "Updated role for";
            return "Updated";
        }
        if (method === "DELETE")
            return "Deleted";
        return "Accessed";
    })();
    if (path.includes("/batch") && Array.isArray(body.entries) && body.entries.length > 0) {
        const count = body.entries.length;
        const totalKobo = body.entries.reduce((sum, entry) => {
            const amount = typeof entry.amountInKobo === "number" ? entry.amountInKobo : 0;
            return sum + amount;
        }, 0);
        const total = (0, documentCurrency_1.formatMinorUnits)(totalKobo, currency);
        return `Batch created ${count} ${resource.toLowerCase()}(s) totaling ${total}`;
    }
    const identifier = (typeof body.name === "string" && body.name) ||
        (typeof body.code === "string" && body.code) ||
        (typeof body.memberName === "string" && body.memberName) ||
        (typeof body.email === "string" && body.email) ||
        (typeof body.purpose === "string" && body.purpose) ||
        (typeof body.description === "string" && body.description) ||
        (segments.length > 1 ? segments[1] : "");
    if (identifier)
        return `${actionWord} ${resource}: ${identifier}`;
    return `${actionWord} ${resource}`;
};
const describeEntityLog = (action, details) => {
    const entity = typeof details.entity === "string" ? singularizeResource(details.entity) : "Record";
    const actionText = (() => {
        if (action.includes("CREATE"))
            return "Created a new";
        if (action.includes("UPDATE"))
            return "Updated";
        if (action.includes("DELETE"))
            return "Deleted";
        if (action.includes("VOID"))
            return "Voided";
        return "Modified";
    })();
    return `${actionText} ${entity}`;
};
const describePeriodLog = (action, details) => {
    const year = typeof details.fiscalYear === "number" ? details.fiscalYear : "?";
    const month = typeof details.month === "number" ? details.month : "?";
    const label = action.includes("LOCK") ? "Locked" : "Unlocked";
    return `${label} fiscal year ${year}, month ${month}`;
};
const generateDescription = (action, details, currency) => {
    if (details.path && details.method)
        return describeHttpLog(details, currency);
    if (details.entity && details.entityId)
        return describeEntityLog(action, details);
    if (details.fiscalYear !== undefined && details.month !== undefined)
        return describePeriodLog(action, details);
    return action;
};
exports.auditService = {
    async log(data) {
        let organizationId = data.organizationId;
        if (!organizationId) {
            try {
                const user = await prisma_1.prisma.user.findUnique({ where: { id: data.userId }, select: { organizationId: true } });
                if (user)
                    organizationId = user.organizationId;
            }
            catch {
                // best-effort
            }
        }
        if (!organizationId) {
            console.warn(`auditService.log dropped: missing organizationId for user ${data.userId}`);
            return null;
        }
        let currency = documentCurrency_1.DEFAULT_CURRENCY;
        try {
            // Read the org row directly rather than via systemSettingsService, which
            // itself logs through this service.
            const org = await prisma_1.prisma.organization.findUnique({
                where: { id: organizationId },
                select: { currency: true },
            });
            currency = (0, documentCurrency_1.normalizeCurrencyCode)(org?.currency);
        }
        catch {
            // best-effort: an unreadable org row must not drop the audit entry
        }
        const description = generateDescription(data.action, data.details, currency);
        return prisma_1.prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                details: { ...data.details, description },
                ipAddress: data.ipAddress,
                organizationId,
            },
        });
    },
    async logCreation(entity, entityId, userId, ipAddress) {
        return this.log({
            userId,
            action: "CREATE_" + entity.toUpperCase(),
            details: { entity, entityId },
            ipAddress,
        });
    },
    async logUpdate(entity, entityId, userId, ipAddress) {
        return this.log({
            userId,
            action: `UPDATE_${entity.toUpperCase()}`,
            details: { entity, entityId },
            ipAddress,
        });
    },
    async logDelete(entity, entityId, userId, ipAddress) {
        return this.log({
            userId,
            action: `DELETE_${entity.toUpperCase()}`,
            details: { entity, entityId },
            ipAddress,
        });
    },
    async logVoid(entity, entityId, userId, ipAddress) {
        return this.log({
            userId,
            action: `VOID_${entity.toUpperCase()}`,
            details: { entity, entityId },
            ipAddress,
        });
    },
    async list(organizationId, filters) {
        const page = filters.page ?? 1;
        const pageSize = filters.pageSize ?? 50;
        const where = { organizationId };
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.action)
            where.action = { contains: filters.action };
        const [data, total] = await Promise.all([
            prisma_1.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                include: { user: { select: { id: true, name: true, email: true, role: true } } },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.auditLog.count({ where }),
        ]);
        return { data, total, page, pageSize };
    },
};
//# sourceMappingURL=auditService.js.map