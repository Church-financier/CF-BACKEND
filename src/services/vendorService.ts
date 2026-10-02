import { prisma } from "../lib/prisma";

export interface VendorInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}

export type VendorUpdateInput = Partial<VendorInput>;

function normalizeOptional(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNullable(value: string | undefined) {
  return value === undefined ? null : value;
}

export const vendorService = {
  async create(data: VendorInput & { organizationId: string }) {
    return prisma.vendor.create({
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

  async list(page = 1, pageSize = 10, organizationId: string) {
    const [data, total] = await Promise.all([
      prisma.vendor.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vendor.count({ where: { organizationId } }),
    ]);
    return { data, total };
  },

  async getById(id: string, organizationId: string) {
    return prisma.vendor.findFirst({ where: { id, organizationId } });
  },

  async update(id: string, data: VendorUpdateInput, organizationId: string) {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.email !== undefined) updateData.email = toNullable(normalizeOptional(data.email));
    if (data.phone !== undefined) updateData.phone = toNullable(normalizeOptional(data.phone));
    if (data.address !== undefined) updateData.address = toNullable(normalizeOptional(data.address));
    if (data.taxId !== undefined) updateData.taxId = toNullable(normalizeOptional(data.taxId));
    if (data.bankName !== undefined) updateData.bankName = toNullable(normalizeOptional(data.bankName));
    if (data.bankAccountName !== undefined) {
      updateData.bankAccountName = toNullable(normalizeOptional(data.bankAccountName));
    }
    if (data.bankAccountNumber !== undefined) {
      updateData.bankAccountNumber = toNullable(normalizeOptional(data.bankAccountNumber));
    }

    await prisma.vendor.updateMany({ where: { id, organizationId }, data: updateData });
    return prisma.vendor.findFirst({ where: { id, organizationId } });
  },

  async delete(id: string, organizationId: string) {
    const count = await prisma.disbursementRequest.count({
      where: { vendorId: id, organizationId },
    });
    if (count > 0) {
      throw new Error("Cannot delete vendor because it is referenced by disbursement requests.");
    }
    return prisma.vendor.deleteMany({ where: { id, organizationId } });
  },
};
