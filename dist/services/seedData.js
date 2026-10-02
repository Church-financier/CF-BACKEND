"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedChartOfAccounts = seedChartOfAccounts;
exports.seedFunds = seedFunds;
exports.seedOrganization = seedOrganization;
const prisma_1 = require("../lib/prisma");
const DEFAULT_CHART_OF_ACCOUNTS = [
    { code: "1000", name: "Cash/Bank", type: "ASSET" },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" },
    { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
    { code: "3000", name: "Equity", type: "EQUITY" },
    { code: "4000", name: "Income", type: "INCOME" },
    { code: "5000", name: "Expenses", type: "EXPENSE" },
];
async function seedChartOfAccounts(organizationId) {
    const existing = await prisma_1.prisma.chartOfAccounts.findMany({
        where: { organizationId },
        select: { code: true },
    });
    const existingCodes = new Set(existing.map((a) => a.code));
    if (existingCodes.size > 0) {
        return;
    }
    const codeToId = new Map();
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
        if (existingCodes.has(account.code))
            continue;
        const created = await prisma_1.prisma.chartOfAccounts.create({
            data: {
                code: account.code,
                name: account.name,
                type: account.type,
                organizationId,
                ...(account.parentCode && codeToId.has(account.parentCode)
                    ? { parentId: codeToId.get(account.parentCode) }
                    : {}),
            },
            select: { id: true, code: true },
        });
        codeToId.set(created.code, created.id);
    }
}
async function seedFunds(organizationId) {
    const existing = await prisma_1.prisma.fund.findFirst({
        where: { organizationId },
        select: { id: true },
    });
    if (existing)
        return;
    await prisma_1.prisma.fund.createMany({
        data: [
            { name: "General Fund", organizationId },
            { name: "Building Fund", organizationId },
            { name: "Welfare Fund", organizationId },
        ],
    });
}
async function seedOrganization(organizationId) {
    await seedChartOfAccounts(organizationId);
    await seedFunds(organizationId);
}
//# sourceMappingURL=seedData.js.map