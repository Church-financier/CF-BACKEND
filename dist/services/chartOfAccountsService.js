"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartOfAccountsService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const appError_1 = require("../utils/appError");
/** Resolves a parent by account code and rejects hierarchy cycles. */
async function resolveParentId(parentAccountCode, organizationId, selfId) {
    const parent = await prisma_1.prisma.chartOfAccounts.findFirst({
        where: { code: parentAccountCode, organizationId },
        select: { id: true, parentId: true },
    });
    if (!parent) {
        throw (0, appError_1.unprocessable)(`Parent account code '${parentAccountCode}' not found`);
    }
    if (selfId) {
        if (parent.id === selfId) {
            throw (0, appError_1.unprocessable)("An account cannot be its own parent");
        }
        // Walk up the existing chain: re-parenting an account under its own
        // descendant would orphan the subtree and make balances unreachable.
        let cursor = parent.id;
        const seen = new Set();
        while (cursor && !seen.has(cursor)) {
            if (cursor === selfId) {
                throw (0, appError_1.unprocessable)("An account cannot be parented under one of its own children");
            }
            seen.add(cursor);
            const node = await prisma_1.prisma.chartOfAccounts.findUnique({
                where: { id: cursor },
                select: { parentId: true },
            });
            cursor = node?.parentId ?? null;
        }
    }
    return parent.id;
}
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
    /**
     * Edits an account: rename, re-code, change type, activate/deactivate, or
     * re-link it to a parent account. Parent links may be given either as
     * `parentAccountCode` (what the UI uses) or `parentId`, and an empty string
     * detaches the account.
     */
    async update(id, data, organizationId) {
        const updateData = {};
        if (data.code !== undefined)
            updateData.code = data.code;
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.parentAccountCode !== undefined) {
            if (data.parentAccountCode === "") {
                updateData.parentId = null;
            }
            else {
                updateData.parentId = await resolveParentId(data.parentAccountCode, organizationId, id);
            }
        }
        else if (data.parentId !== undefined) {
            if (data.parentId === "") {
                updateData.parentId = null;
            }
            else {
                if (data.parentId === id) {
                    throw (0, appError_1.unprocessable)("An account cannot be its own parent");
                }
                const parent = await prisma_1.prisma.chartOfAccounts.findFirst({
                    where: { id: data.parentId, organizationId },
                    select: { id: true },
                });
                if (!parent)
                    throw (0, appError_1.unprocessable)("Parent account not found in organization");
                updateData.parentId = data.parentId;
            }
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const result = await tx.chartOfAccounts.updateMany({
                where: { id, organizationId },
                data: updateData,
            });
            if (result.count === 0) {
                throw (0, appError_1.unprocessable)("Account not found");
            }
            return tx.chartOfAccounts.findFirst({
                where: { id, organizationId },
                include: { parent: true, children: true },
            });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 10000 });
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