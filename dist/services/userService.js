"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
exports.userService = {
    async list(organizationId) {
        return prisma_1.prisma.user.findMany({
            where: { organizationId },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
            orderBy: { createdAt: "desc" },
        });
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.user.findFirst({
            where: { id, organizationId },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
    },
    async create(data) {
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        const role = data.role || "SUPER_ADMIN";
        const user = await prisma_1.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role,
                organizationId: data.organizationId,
            },
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        };
    },
    async updateRole(id, role, organizationId) {
        await prisma_1.prisma.user.updateMany({ where: { id, organizationId }, data: { role: role } });
        return prisma_1.prisma.user.findFirst({ where: { id, organizationId }, select: { id: true, email: true, name: true, role: true, createdAt: true } });
    },
    async delete(id, organizationId) {
        const user = await prisma_1.prisma.user.findFirst({ where: { id, organizationId } });
        if (!user)
            throw new Error("User not found");
        await prisma_1.prisma.$transaction(async (tx) => {
            const [departmentCount, disbursementCount, journalCount, ledgerCount] = await Promise.all([
                tx.department.count({ where: { headId: id } }),
                tx.disbursementRequest.count({ where: { OR: [{ requestedById: id }, { approvedById: id }] } }),
                tx.journalEntry.count({ where: { createdById: id } }),
                tx.ledgerEntry.count({ where: { recordedById: id } }),
            ]);
            if (departmentCount > 0 || disbursementCount > 0 || journalCount > 0 || ledgerCount > 0) {
                throw new Error("Cannot delete user because they are referenced by department, disbursement, journal, or ledger records. Reassign or remove those records first.");
            }
            await tx.auditLog.deleteMany({ where: { userId: id } });
            await tx.user.delete({ where: { id } });
        });
    },
};
//# sourceMappingURL=userService.js.map