import { prisma } from "../lib/prisma";

export const memberService = {
  async create(data: {
    organizationId: string;
    fullName: string;
    email?: string;
    phone?: string;
    address?: string;
    memberNumber?: string;
  }) {
    return prisma.member.create({
      data,
      select: { id: true, fullName: true, email: true, phone: true, address: true, memberNumber: true, joinedAt: true, isActive: true, portalAccess: true, createdAt: true },
    });
  },

  async list(page = 1, pageSize = 50, organizationId: string, search?: string) {
    const where: any = { organizationId };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { memberNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, email: true, phone: true, address: true, memberNumber: true, joinedAt: true, isActive: true, portalAccess: true, createdAt: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.member.count({ where }),
    ]);
    return { data, total };
  },

  async getById(id: string, organizationId: string) {
    return prisma.member.findFirst({
      where: { id, organizationId },
      select: { id: true, fullName: true, email: true, phone: true, address: true, memberNumber: true, joinedAt: true, isActive: true, portalAccess: true, createdAt: true },
    });
  },

  async update(id: string, data: any, organizationId: string) {
    await prisma.member.updateMany({ where: { id, organizationId }, data });
    return prisma.member.findFirst({
      where: { id, organizationId },
      select: { id: true, fullName: true, email: true, phone: true, address: true, memberNumber: true, joinedAt: true, isActive: true, portalAccess: true, createdAt: true },
    });
  },

  async delete(id: string, organizationId: string) {
    return prisma.member.updateMany({ where: { id, organizationId }, data: { isActive: false } });
  },
};
