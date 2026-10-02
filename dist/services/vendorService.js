"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorService = void 0;
const prisma_1 = require("../lib/prisma");
function normalizeOptional(value) {
    if (value === undefined || value === null)
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function toNullable(value) {
    return value === undefined ? null : value;
}
exports.vendorService = {
    async create(data) {
        return prisma_1.prisma.vendor.create({
            data: {
                name: data.name.trim(),
                email: toNullable(normalizeOptional(data.email)),
                phone: toNullable(normalizeOptional(data.phone)),
                address: toNullable(normalizeOptional(data.address)),
                taxId: toNullable(normalizeOptional(data.taxId)),
                bankName: toNullable(normalizeOptional(data.bankName)),
                bankAccountName: toNullable(normalizeOptional(data.bankAccountName)),
                bankAccountNumber: toNullable(normalizeOptional(data.bankAccountNumber)),
                organizationId: data.organizationId,
            },
        });
    },
    async list(page = 1, pageSize = 10, organizationId) {
        const [data, total] = await Promise.all([
            prisma_1.prisma.vendor.findMany({
                where: { organizationId },
                orderBy: { name: "asc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.vendor.count({ where: { organizationId } }),
        ]);
        return { data, total };
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.vendor.findFirst({ where: { id, organizationId } });
    },
    async update(id, data, organizationId) {
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name.trim();
        if (data.email !== undefined)
            updateData.email = toNullable(normalizeOptional(data.email));
        if (data.phone !== undefined)
            updateData.phone = toNullable(normalizeOptional(data.phone));
        if (data.address !== undefined)
            updateData.address = toNullable(normalizeOptional(data.address));
        if (data.taxId !== undefined)
            updateData.taxId = toNullable(normalizeOptional(data.taxId));
        if (data.bankName !== undefined)
            updateData.bankName = toNullable(normalizeOptional(data.bankName));
        if (data.bankAccountName !== undefined) {
            updateData.bankAccountName = toNullable(normalizeOptional(data.bankAccountName));
        }
        if (data.bankAccountNumber !== undefined) {
            updateData.bankAccountNumber = toNullable(normalizeOptional(data.bankAccountNumber));
        }
        await prisma_1.prisma.vendor.updateMany({ where: { id, organizationId }, data: updateData });
        return prisma_1.prisma.vendor.findFirst({ where: { id, organizationId } });
    },
    async delete(id, organizationId) {
        const count = await prisma_1.prisma.disbursementRequest.count({
            where: { vendorId: id, organizationId },
        });
        if (count > 0) {
            throw new Error("Cannot delete vendor because it is referenced by disbursement requests.");
        }
        return prisma_1.prisma.vendor.deleteMany({ where: { id, organizationId } });
    },
};
//# sourceMappingURL=vendorService.js.map