"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberService = void 0;
const prisma_1 = require("../lib/prisma");
exports.memberService = {
    async create(data) {
        return prisma_1.prisma.member.create({
            data,
            select: { id: true, fullName: true, email: true, phone: true, address: true, memberNumber: true, joinedAt: true, isActive: true, portalAccess: true, createdAt: true },
        });
    },
    async list(page = 1, pageSize = 50, organizationId, search) {
        const where = { organizationId };
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { memberNumber: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
            ];
        }
        const [data, total] = await Promise.all([
            prisma_1.prisma.member.findMany({
                where,
                orderBy: { fullName: "asc" },
                select: { id: true, fullName: true, email: true, phone: true, address: true, memberNumber: true, joinedAt: true, isActive: true, portalAccess: true, createdAt: true },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.member.count({ where }),
        ]);
        return { data, total };
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.member.findFirst({
            where: { id, organizationId },
            select: { id: true, fullName: true, email: true, phone: true, address: true, memberNumber: true, joinedAt: true, isActive: true, portalAccess: true, createdAt: true },
        });
    },
    async update(id, data, organizationId) {
        await prisma_1.prisma.member.updateMany({ where: { id, organizationId }, data });
        return prisma_1.prisma.member.findFirst({
            where: { id, organizationId },
            select: { id: true, fullName: true, email: true, phone: true, address: true, memberNumber: true, joinedAt: true, isActive: true, portalAccess: true, createdAt: true },
        });
    },
    async delete(id, organizationId) {
        return prisma_1.prisma.member.updateMany({ where: { id, organizationId }, data: { isActive: false } });
    },
};
//# sourceMappingURL=memberService.js.map