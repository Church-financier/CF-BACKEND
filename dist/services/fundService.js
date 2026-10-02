"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundService = void 0;
const prisma_1 = require("../lib/prisma");
const balanceService_1 = require("./balanceService");
exports.fundService = {
    async create(data) {
        return prisma_1.prisma.fund.create({ data });
    },
    async list(page = 1, pageSize = 10, organizationId) {
        const [funds, total, balances] = await Promise.all([
            prisma_1.prisma.fund.findMany({
                where: { organizationId },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.fund.count({ where: { organizationId } }),
            (0, balanceService_1.computeFundBalances)(organizationId),
        ]);
        const data = funds.map((fund) => {
            const balance = balances.get(fund.id);
            return {
                ...fund,
                inflowInKobo: balance?.inflowInKobo ?? BigInt(0),
                outflowInKobo: balance?.outflowInKobo ?? BigInt(0),
                balanceInKobo: balance?.balanceInKobo ?? BigInt(0),
            };
        });
        return { data, total };
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.fund.findFirst({ where: { id, organizationId } });
    },
    async update(id, data, organizationId) {
        await prisma_1.prisma.fund.updateMany({ where: { id, organizationId }, data });
        return prisma_1.prisma.fund.findFirst({ where: { id, organizationId } });
    },
    async delete(id, organizationId) {
        const [entryCount, pledgeCount, budgetCount] = await Promise.all([
            prisma_1.prisma.ledgerEntry.count({ where: { fundId: id, organizationId } }),
            prisma_1.prisma.pledge.count({ where: { fundId: id, organizationId } }),
            prisma_1.prisma.budget.count({ where: { fundId: id, organizationId } }),
        ]);
        if (entryCount > 0 || pledgeCount > 0 || budgetCount > 0) {
            throw new Error("Cannot delete fund because it is referenced by existing transactions, pledges, or budgets.");
        }
        return prisma_1.prisma.fund.deleteMany({ where: { id, organizationId } });
    },
    async getBalance(fundId, organizationId) {
        const balances = await (0, balanceService_1.computeFundBalances)(organizationId, [fundId]);
        return balances.get(fundId)?.balanceInKobo ?? BigInt(0);
    },
};
//# sourceMappingURL=fundService.js.map