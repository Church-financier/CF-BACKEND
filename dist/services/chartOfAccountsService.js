"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartOfAccountsService = void 0;
const prisma_1 = require("../lib/prisma");
exports.chartOfAccountsService = {
    async create(data) {
        const { parentAccountCode, parentId, ...rest } = data;
        let resolvedParentId;
        if (parentAccountCode) {
            const parentAccount = await prisma_1.prisma.chartOfAccounts.findFirst({
                where: { code: parentAccountCode, organizationId: data.organizationId, isActive: true },
                select: { id: true },
            });
            if (!parentAccount) {
                throw new Error(`Parent account code '${parentAccountCode}' not found`);
            }
            resolvedParentId = parentAccount.id;
        }
        else if (parentId) {
            resolvedParentId = parentId;
        }
        return prisma_1.prisma.chartOfAccounts.create({
            data: {
                ...rest,
                organizationId: data.organizationId,
                ...(resolvedParentId ? { parentId: resolvedParentId } : {}),
            },
        });
    },
    async list(page = 1, pageSize = 10, organizationId) {
        const [data, total] = await Promise.all([
            prisma_1.prisma.chartOfAccounts.findMany({
                where: { organizationId },
                orderBy: { code: "asc" },
                include: { parent: true },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.chartOfAccounts.count({ where: { organizationId } }),
        ]);
        return { data, total };
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.chartOfAccounts.findFirst({
            where: { id, organizationId },
            include: { parent: true, children: true },
        });
    },
    async listChildren(parentId, page = 1, pageSize = 10, organizationId) {
        const where = { parentId, organizationId };
        const [data, total] = await Promise.all([
            prisma_1.prisma.chartOfAccounts.findMany({
                where,
                orderBy: { code: "asc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.chartOfAccounts.count({ where }),
        ]);
        return { data, total };
    },
    async update(id, data, organizationId) {
        const updateData = {};
        if (data.code !== undefined)
            updateData.code = data.code;
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.parentId !== undefined) {
            updateData.parentId = data.parentId || null;
        }
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        await prisma_1.prisma.chartOfAccounts.updateMany({ where: { id, organizationId }, data: updateData });
        return prisma_1.prisma.chartOfAccounts.findFirst({ where: { id, organizationId }, include: { parent: true, children: true } });
    },
    async delete(id, organizationId) {
        const lineCount = await prisma_1.prisma.journalLine.count({
            where: {
                accountId: id,
                journalEntry: { organizationId },
            },
        });
        if (lineCount > 0) {
            throw new Error("Cannot delete account because it is referenced by journal entries.");
        }
        await prisma_1.prisma.chartOfAccounts.deleteMany({ where: { id, organizationId } });
    },
};
//# sourceMappingURL=chartOfAccountsService.js.map