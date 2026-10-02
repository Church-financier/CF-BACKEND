import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

export const userService = {
  async list(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string, organizationId: string) {
    return prisma.user.findFirst({
      where: { id, organizationId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  },

  async create(data: { email: string; password: string; name: string; role?: string; organizationId: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const role = (data.role as Role) || "SUPER_ADMIN";
    const user = await prisma.user.create({
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

  async updateRole(id: string, role: string, organizationId: string) {
    await prisma.user.updateMany({ where: { id, organizationId }, data: { role: role as Role } });
    return prisma.user.findFirst({ where: { id, organizationId }, select: { id: true, email: true, name: true, role: true, createdAt: true } });
  },

  async delete(id: string, organizationId: string) {
    const user = await prisma.user.findFirst({ where: { id, organizationId } });
    if (!user) throw new Error("User not found");

    await prisma.$transaction(async (tx) => {
      const [departmentCount, disbursementCount, journalCount, ledgerCount] = await Promise.all([
        tx.department.count({ where: { headId: id } }),
        tx.disbursementRequest.count({ where: { OR: [{ requestedById: id }, { approvedById: id }] } }),
        tx.journalEntry.count({ where: { createdById: id } }),
        tx.ledgerEntry.count({ where: { recordedById: id } }),
      ]);

      if (departmentCount > 0 || disbursementCount > 0 || journalCount > 0 || ledgerCount > 0) {
        throw new Error(
          "Cannot delete user because they are referenced by department, disbursement, journal, or ledger records. Reassign or remove those records first.",
        );
      }

      await tx.auditLog.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });
  },
};
