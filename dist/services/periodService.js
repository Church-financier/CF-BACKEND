"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.periodService = void 0;
const prisma_1 = require("../lib/prisma");
const auditService_1 = require("./auditService");
exports.periodService = {
    async list(organizationId) {
        return prisma_1.prisma.period.findMany({
            where: { organizationId },
            orderBy: [{ fiscalYear: "desc" }, { month: "desc" }],
        });
    },
    async get(fiscalYear, month, organizationId) {
        return prisma_1.prisma.period.findUnique({
            where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
        });
    },
    async lock(fiscalYear, month, organizationId, userId) {
        const period = await prisma_1.prisma.period.upsert({
            where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
            create: {
                organizationId,
                fiscalYear,
                month,
                isLocked: true,
                lockedById: userId,
                lockedAt: new Date(),
            },
            update: {
                isLocked: true,
                lockedById: userId,
                lockedAt: new Date(),
            },
        });
        await auditService_1.auditService.log({
            userId,
            organizationId,
            action: "PERIOD_LOCK",
            details: { fiscalYear, month },
        });
        return period;
    },
    async unlock(fiscalYear, month, organizationId, userId) {
        const period = await prisma_1.prisma.period.update({
            where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
            data: { isLocked: false, lockedById: null, lockedAt: null },
        });
        await auditService_1.auditService.log({
            userId,
            organizationId,
            action: "PERIOD_UNLOCK",
            details: { fiscalYear, month },
        });
        return period;
    },
    async isLocked(fiscalYear, month, organizationId) {
        const p = await prisma_1.prisma.period.findUnique({
            where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
        });
        return p?.isLocked ?? false;
    },
};
//# sourceMappingURL=periodService.js.map