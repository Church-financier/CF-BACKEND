"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetPeriodService = void 0;
const prisma_1 = require("../lib/prisma");
exports.budgetPeriodService = {
    async create(data) {
        const existing = await prisma_1.prisma.budgetPeriod.findUnique({
            where: {
                organizationId_fiscalYear: {
                    organizationId: data.organizationId,
                    fiscalYear: data.fiscalYear,
                },
            },
        });
        if (existing) {
            const err = new Error("Budget period already exists for this fiscal year");
            err.code = "BUDGET_PERIOD_EXISTS";
            throw err;
        }
        return prisma_1.prisma.budgetPeriod.create({
            data: {
                fiscalYear: data.fiscalYear,
                submissionDeadline: data.submissionDeadline,
                organizationId: data.organizationId,
            },
            include: {
                departmentBudgets: {
                    include: {
                        department: { select: { id: true, name: true } },
                        submittedBy: { select: { id: true, name: true } },
                        items: {
                            include: { category: { select: { id: true, code: true, name: true } } },
                        },
                    },
                },
            },
        });
    },
    async list(page = 1, pageSize = 10, organizationId) {
        const [data, total] = await Promise.all([
            prisma_1.prisma.budgetPeriod.findMany({
                where: { organizationId },
                include: {
                    departmentBudgets: {
                        include: {
                            department: { select: { id: true, name: true } },
                            submittedBy: { select: { id: true, name: true } },
                        },
                        orderBy: { department: { name: "asc" } },
                    },
                },
                orderBy: { fiscalYear: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.budgetPeriod.count({ where: { organizationId } }),
        ]);
        return { data, total };
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.budgetPeriod.findFirst({
            where: { id, organizationId },
            include: {
                departmentBudgets: {
                    include: {
                        department: { select: { id: true, name: true } },
                        submittedBy: { select: { id: true, name: true } },
                        items: {
                            include: { category: { select: { id: true, code: true, name: true, type: true } } },
                        },
                    },
                    orderBy: { department: { name: "asc" } },
                },
            },
        });
    },
    async getActive(organizationId) {
        return prisma_1.prisma.budgetPeriod.findFirst({
            where: {
                organizationId,
                status: { in: ["SUBMISSION_OPEN", "UNDER_REVIEW"] },
            },
            orderBy: { fiscalYear: "desc" },
            include: {
                departmentBudgets: {
                    include: {
                        department: { select: { id: true, name: true } },
                        submittedBy: { select: { id: true, name: true } },
                        items: {
                            include: { category: { select: { id: true, code: true, name: true, type: true } } },
                        },
                    },
                    orderBy: { department: { name: "asc" } },
                },
            },
        });
    },
    async getByFiscalYear(fiscalYear, organizationId) {
        return prisma_1.prisma.budgetPeriod.findUnique({
            where: { organizationId_fiscalYear: { organizationId, fiscalYear } },
            include: {
                departmentBudgets: {
                    include: {
                        department: { select: { id: true, name: true } },
                        submittedBy: { select: { id: true, name: true } },
                        items: {
                            include: { category: { select: { id: true, code: true, name: true, type: true } } },
                        },
                    },
                    orderBy: { department: { name: "asc" } },
                },
            },
        });
    },
    async update(id, organizationId, data) {
        if (data.fiscalYear) {
            const existing = await prisma_1.prisma.budgetPeriod.findUnique({
                where: { organizationId_fiscalYear: { organizationId, fiscalYear: data.fiscalYear } },
            });
            if (existing && existing.id !== id) {
                const err = new Error("Budget period already exists for this fiscal year");
                err.code = "BUDGET_PERIOD_EXISTS";
                throw err;
            }
        }
        await prisma_1.prisma.budgetPeriod.updateMany({ where: { id, organizationId }, data: data });
        return prisma_1.prisma.budgetPeriod.findFirst({
            where: { id, organizationId },
            include: {
                departmentBudgets: {
                    include: {
                        department: { select: { id: true, name: true } },
                        submittedBy: { select: { id: true, name: true } },
                        items: { include: { category: { select: { id: true, code: true, name: true } } } },
                    },
                },
            },
        });
    },
    async openSubmission(id, organizationId, submissionDeadline) {
        const period = await prisma_1.prisma.budgetPeriod.findFirst({
            where: { id, organizationId },
        });
        if (!period) {
            const err = new Error("Budget period not found");
            err.code = "BUDGET_PERIOD_NOT_FOUND";
            throw err;
        }
        if (period.status !== "DRAFT") {
            const err = new Error("Can only open submission for DRAFT periods");
            err.code = "INVALID_PERIOD_STATUS";
            throw err;
        }
        return prisma_1.prisma.budgetPeriod.update({
            where: { id },
            data: {
                status: "SUBMISSION_OPEN",
                submissionDeadline,
            },
            include: {
                departmentBudgets: {
                    include: {
                        department: { select: { id: true, name: true } },
                        submittedBy: { select: { id: true, name: true } },
                    },
                },
            },
        });
    },
    async closeSubmission(id, organizationId) {
        const period = await prisma_1.prisma.budgetPeriod.findFirst({
            where: { id, organizationId },
        });
        if (!period) {
            const err = new Error("Budget period not found");
            err.code = "BUDGET_PERIOD_NOT_FOUND";
            throw err;
        }
        if (period.status !== "SUBMISSION_OPEN") {
            const err = new Error("Submission is not currently open");
            err.code = "INVALID_PERIOD_STATUS";
            throw err;
        }
        return prisma_1.prisma.budgetPeriod.update({
            where: { id },
            data: { status: "UNDER_REVIEW" },
            include: {
                departmentBudgets: {
                    include: {
                        department: { select: { id: true, name: true } },
                        submittedBy: { select: { id: true, name: true } },
                        items: { include: { category: { select: { id: true, code: true, name: true } } } },
                    },
                },
            },
        });
    },
    async approveAndLock(id, organizationId) {
        const period = await prisma_1.prisma.budgetPeriod.findFirst({
            where: { id, organizationId },
            include: { departmentBudgets: true },
        });
        if (!period) {
            const err = new Error("Budget period not found");
            err.code = "BUDGET_PERIOD_NOT_FOUND";
            throw err;
        }
        if (period.status === "APPROVED_AND_LOCKED") {
            const err = new Error("Budget period is already approved and locked");
            err.code = "ALREADY_LOCKED";
            throw err;
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            const updatedPeriod = await tx.budgetPeriod.update({
                where: { id },
                data: { status: "APPROVED_AND_LOCKED" },
            });
            await tx.departmentBudget.updateMany({
                where: { budgetPeriodId: id, status: { in: ["SUBMITTED", "REVISED"] } },
                data: { status: "APPROVED" },
            });
            return updatedPeriod;
        });
    },
    async delete(id, organizationId) {
        const period = await prisma_1.prisma.budgetPeriod.findFirst({
            where: { id, organizationId },
            include: { departmentBudgets: true },
        });
        if (!period) {
            const err = new Error("Budget period not found");
            err.code = "BUDGET_PERIOD_NOT_FOUND";
            throw err;
        }
        if (period.status === "APPROVED_AND_LOCKED") {
            const err = new Error("Cannot delete an approved and locked budget period");
            err.code = "PERIOD_LOCKED";
            throw err;
        }
        return prisma_1.prisma.budgetPeriod.deleteMany({ where: { id, organizationId } });
    },
};
//# sourceMappingURL=budgetPeriodService.js.map