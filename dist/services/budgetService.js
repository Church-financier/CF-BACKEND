"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetService = void 0;
const prisma_1 = require("../lib/prisma");
exports.budgetService = {
    async create(data) {
        const department = await prisma_1.prisma.department.findFirst({
            where: { id: data.departmentId, organizationId: data.organizationId },
            select: { id: true },
        });
        if (!department) {
            const err = new Error("Department not found in organization");
            err.code = "DEPARTMENT_NOT_FOUND";
            throw err;
        }
        const fund = await prisma_1.prisma.fund.findFirst({
            where: { id: data.fundId, organizationId: data.organizationId },
            select: { id: true },
        });
        if (!fund) {
            const err = new Error("Fund not found in organization");
            err.code = "FUND_NOT_FOUND";
            throw err;
        }
        return prisma_1.prisma.budget.create({
            data: {
                departmentId: data.departmentId,
                fundId: data.fundId,
                fiscalYear: data.fiscalYear,
                month: data.month,
                amountInKobo: data.amountInKobo,
                organizationId: data.organizationId,
            },
            include: {
                department: { select: { id: true, name: true } },
                fund: { select: { id: true, name: true } },
            },
        });
    },
    async list(page = 1, pageSize = 10, organizationId, filters) {
        const where = { organizationId };
        if (filters?.departmentId)
            where.departmentId = filters.departmentId;
        if (filters?.fundId)
            where.fundId = filters.fundId;
        if (filters?.fiscalYear)
            where.fiscalYear = filters.fiscalYear;
        const [data, total] = await Promise.all([
            prisma_1.prisma.budget.findMany({
                where,
                include: {
                    department: { select: { id: true, name: true } },
                    fund: { select: { id: true, name: true } },
                },
                orderBy: [{ fiscalYear: "desc" }, { month: "desc" }, { department: { name: "asc" } }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.budget.count({ where }),
        ]);
        return { data, total };
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.budget.findFirst({
            where: { id, organizationId },
            include: {
                department: { select: { id: true, name: true } },
                fund: { select: { id: true, name: true } },
            },
        });
    },
    async update(id, organizationId, data) {
        if (data.departmentId) {
            const department = await prisma_1.prisma.department.findFirst({
                where: { id: data.departmentId, organizationId },
                select: { id: true },
            });
            if (!department) {
                const err = new Error("Department not found in organization");
                err.code = "DEPARTMENT_NOT_FOUND";
                throw err;
            }
        }
        if (data.fundId) {
            const fund = await prisma_1.prisma.fund.findFirst({
                where: { id: data.fundId, organizationId },
                select: { id: true },
            });
            if (!fund) {
                const err = new Error("Fund not found in organization");
                err.code = "FUND_NOT_FOUND";
                throw err;
            }
        }
        await prisma_1.prisma.budget.updateMany({ where: { id, organizationId }, data });
        return prisma_1.prisma.budget.findFirst({
            where: { id, organizationId },
            include: {
                department: { select: { id: true, name: true } },
                fund: { select: { id: true, name: true } },
            },
        });
    },
    async delete(id, organizationId) {
        return prisma_1.prisma.budget.deleteMany({ where: { id, organizationId } });
    },
};
//# sourceMappingURL=budgetService.js.map