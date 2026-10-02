"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentBudgetService = void 0;
const prisma_1 = require("../lib/prisma");
exports.departmentBudgetService = {
    async create(data) {
        const period = await prisma_1.prisma.budgetPeriod.findFirst({
            where: { id: data.budgetPeriodId, organizationId: data.organizationId },
        });
        if (!period) {
            const err = new Error("Budget period not found");
            err.code = "BUDGET_PERIOD_NOT_FOUND";
            throw err;
        }
        if (period.status !== "SUBMISSION_OPEN") {
            const err = new Error("Budget submissions are not open for this period");
            err.code = "SUBMISSION_CLOSED";
            throw err;
        }
        const department = await prisma_1.prisma.department.findFirst({
            where: { id: data.departmentId, organizationId: data.organizationId },
        });
        if (!department) {
            const err = new Error("Department not found");
            err.code = "DEPARTMENT_NOT_FOUND";
            throw err;
        }
        const existing = await prisma_1.prisma.departmentBudget.findUnique({
            where: { budgetPeriodId_departmentId: { budgetPeriodId: data.budgetPeriodId, departmentId: data.departmentId } },
        });
        if (existing) {
            const err = new Error("Department budget already exists for this period");
            err.code = "DEPARTMENT_BUDGET_EXISTS";
            throw err;
        }
        return prisma_1.prisma.departmentBudget.create({
            data: {
                budgetPeriodId: data.budgetPeriodId,
                departmentId: data.departmentId,
                submittedByUserId: data.submittedByUserId,
                status: "DRAFT",
            },
            include: {
                department: { select: { id: true, name: true } },
                submittedBy: { select: { id: true, name: true } },
                items: { include: { category: { select: { id: true, code: true, name: true } } } },
            },
        });
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.departmentBudget.findFirst({
            where: { id, budgetPeriod: { organizationId } },
            include: {
                budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
                department: { select: { id: true, name: true } },
                submittedBy: { select: { id: true, name: true } },
                items: {
                    include: { category: { select: { id: true, code: true, name: true, type: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },
    async getByPeriodAndDepartment(budgetPeriodId, departmentId, organizationId) {
        return prisma_1.prisma.departmentBudget.findFirst({
            where: {
                budgetPeriodId,
                departmentId,
                budgetPeriod: { organizationId },
            },
            include: {
                department: { select: { id: true, name: true } },
                submittedBy: { select: { id: true, name: true } },
                items: {
                    include: { category: { select: { id: true, code: true, name: true, type: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },
    async listByPeriod(budgetPeriodId, organizationId) {
        const period = await prisma_1.prisma.budgetPeriod.findFirst({
            where: { id: budgetPeriodId, organizationId },
        });
        if (!period) {
            const err = new Error("Budget period not found");
            err.code = "BUDGET_PERIOD_NOT_FOUND";
            throw err;
        }
        return prisma_1.prisma.departmentBudget.findMany({
            where: { budgetPeriodId, budgetPeriod: { organizationId } },
            include: {
                department: { select: { id: true, name: true } },
                submittedBy: { select: { id: true, name: true } },
                items: {
                    include: { category: { select: { id: true, code: true, name: true } } },
                },
            },
            orderBy: { department: { name: "asc" } },
        });
    },
    async listByUser(userId, organizationId) {
        return prisma_1.prisma.departmentBudget.findMany({
            where: {
                submittedByUserId: userId,
                budgetPeriod: { organizationId },
            },
            include: {
                budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
                department: { select: { id: true, name: true } },
                items: {
                    include: { category: { select: { id: true, code: true, name: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async update(id, organizationId, data) {
        const budget = await this.getById(id, organizationId);
        if (!budget) {
            const err = new Error("Department budget not found");
            err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
            throw err;
        }
        await prisma_1.prisma.departmentBudget.updateMany({
            where: { id, budgetPeriod: { organizationId } },
            data: data,
        });
        return this.getById(id, organizationId);
    },
    async recalculateTotals(id, organizationId) {
        const items = await prisma_1.prisma.budgetItem.findMany({
            where: { departmentBudgetId: id, departmentBudget: { budgetPeriod: { organizationId } } },
            select: { proposedTotal: true, approvedTotal: true },
        });
        const totalProposed = items.reduce((sum, item) => sum + item.proposedTotal, BigInt(0));
        const totalApproved = items.reduce((sum, item) => sum + (item.approvedTotal ?? BigInt(0)), BigInt(0));
        await prisma_1.prisma.departmentBudget.updateMany({
            where: { id, budgetPeriod: { organizationId } },
            data: { totalProposedAmount: totalProposed, totalApprovedAmount: totalApproved },
        });
        return { totalProposedAmount: totalProposed, totalApprovedAmount: totalApproved };
    },
    async submit(id, userId, organizationId) {
        const budget = await this.getById(id, organizationId);
        if (!budget) {
            const err = new Error("Department budget not found");
            err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
            throw err;
        }
        if (budget.submittedByUserId !== userId) {
            const err = new Error("You can only submit your own department budget");
            err.code = "UNAUTHORIZED";
            throw err;
        }
        if (!["DRAFT", "REVISED"].includes(budget.status)) {
            const err = new Error("Only draft or revised budgets can be submitted");
            err.code = "INVALID_STATUS";
            throw err;
        }
        if (budget.budgetPeriod.status !== "SUBMISSION_OPEN") {
            const err = new Error("Budget submission window is closed");
            err.code = "SUBMISSION_CLOSED";
            throw err;
        }
        const totals = await this.recalculateTotals(id, organizationId);
        return prisma_1.prisma.departmentBudget.update({
            where: { id },
            data: { status: "SUBMITTED", totalProposedAmount: totals.totalProposedAmount },
            include: {
                budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
                department: { select: { id: true, name: true } },
                submittedBy: { select: { id: true, name: true } },
                items: {
                    include: { category: { select: { id: true, code: true, name: true, type: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },
    async returnForRevision(id, organizationId, rejectionNotes) {
        const budget = await this.getById(id, organizationId);
        if (!budget) {
            const err = new Error("Department budget not found");
            err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
            throw err;
        }
        if (!["SUBMITTED", "REVISED"].includes(budget.status)) {
            const err = new Error("Only submitted or revised budgets can be returned for revision");
            err.code = "INVALID_STATUS";
            throw err;
        }
        return prisma_1.prisma.departmentBudget.update({
            where: { id },
            data: { status: "REVISED", rejectionNotes },
            include: {
                budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
                department: { select: { id: true, name: true } },
                submittedBy: { select: { id: true, name: true } },
                items: {
                    include: { category: { select: { id: true, code: true, name: true, type: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },
    async approve(id, organizationId, itemApprovals) {
        const budget = await this.getById(id, organizationId);
        if (!budget) {
            const err = new Error("Department budget not found");
            err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
            throw err;
        }
        if (budget.budgetPeriod.status !== "UNDER_REVIEW") {
            const err = new Error("Budget period is not under review");
            err.code = "INVALID_PERIOD_STATUS";
            throw err;
        }
        return prisma_1.prisma.$transaction(async (tx) => {
            for (const approval of itemApprovals) {
                await tx.budgetItem.update({
                    where: { id: approval.budgetItemId },
                    data: { approvedTotal: approval.approvedTotal },
                });
            }
            const totals = await this.recalculateTotals(id, organizationId);
            return tx.departmentBudget.update({
                where: { id },
                data: {
                    status: "APPROVED",
                    totalApprovedAmount: totals.totalApprovedAmount,
                },
                include: {
                    budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
                    department: { select: { id: true, name: true } },
                    submittedBy: { select: { id: true, name: true } },
                    items: {
                        include: { category: { select: { id: true, code: true, name: true, type: true } } },
                        orderBy: { createdAt: "asc" },
                    },
                },
            });
        });
    },
    async reject(id, organizationId, rejectionNotes) {
        const budget = await this.getById(id, organizationId);
        if (!budget) {
            const err = new Error("Department budget not found");
            err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
            throw err;
        }
        if (!["SUBMITTED", "REVISED"].includes(budget.status)) {
            const err = new Error("Only submitted or revised budgets can be rejected");
            err.code = "INVALID_STATUS";
            throw err;
        }
        return prisma_1.prisma.departmentBudget.update({
            where: { id },
            data: { status: "REJECTED", rejectionNotes },
            include: {
                budgetPeriod: { select: { id: true, fiscalYear: true, status: true } },
                department: { select: { id: true, name: true } },
                submittedBy: { select: { id: true, name: true } },
                items: {
                    include: { category: { select: { id: true, code: true, name: true, type: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    },
    async delete(id, organizationId) {
        const budget = await this.getById(id, organizationId);
        if (!budget) {
            const err = new Error("Department budget not found");
            err.code = "DEPARTMENT_BUDGET_NOT_FOUND";
            throw err;
        }
        if (budget.status !== "DRAFT") {
            const err = new Error("Only draft budgets can be deleted");
            err.code = "INVALID_STATUS";
            throw err;
        }
        return prisma_1.prisma.departmentBudget.deleteMany({ where: { id, budgetPeriod: { organizationId } } });
    },
};
//# sourceMappingURL=departmentBudgetService.js.map