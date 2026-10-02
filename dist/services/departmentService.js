"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentService = void 0;
const prisma_1 = require("../lib/prisma");
exports.departmentService = {
    async create(data) {
        return prisma_1.prisma.department.create({
            data: {
                name: data.name,
                description: data.description,
                headId: data.headId,
                organizationId: data.organizationId,
            },
        });
    },
    async list(page = 1, pageSize = 10, organizationId) {
        const [data, total] = await Promise.all([
            prisma_1.prisma.department.findMany({
                where: { organizationId },
                include: { head: { select: { id: true, name: true, email: true } } },
                orderBy: { name: "asc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.department.count({ where: { organizationId } }),
        ]);
        return { data, total };
    },
    async listForHead(page = 1, pageSize = 10, headId, organizationId) {
        const [data, total] = await Promise.all([
            prisma_1.prisma.department.findMany({
                where: { organizationId, headId },
                include: { head: { select: { id: true, name: true, email: true } } },
                orderBy: { name: "asc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.department.count({ where: { organizationId, headId } }),
        ]);
        return { data, total };
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.department.findFirst({
            where: { id, organizationId },
            include: { head: { select: { id: true, name: true, email: true } } },
        });
    },
    async update(id, data, organizationId) {
        await prisma_1.prisma.department.updateMany({ where: { id, organizationId }, data });
        return prisma_1.prisma.department.findFirst({
            where: { id, organizationId },
            include: { head: { select: { id: true, name: true, email: true } } },
        });
    },
    async delete(id, organizationId) {
        const [disbursementCount, headCount, budgetCount] = await Promise.all([
            prisma_1.prisma.disbursementRequest.count({ where: { departmentId: id, organizationId } }),
            prisma_1.prisma.user.count({ where: { headId: id, organizationId } }),
            prisma_1.prisma.budget.count({ where: { departmentId: id, organizationId } }),
        ]);
        if (disbursementCount > 0 || headCount > 0 || budgetCount > 0) {
            throw new Error("Cannot delete department because it is referenced by disbursement requests, users, or budgets.");
        }
        return prisma_1.prisma.department.deleteMany({ where: { id, organizationId } });
    },
};
//# sourceMappingURL=departmentService.js.map