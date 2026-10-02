import { AccountType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { unprocessable } from "../utils/appError";

/** Resolves a parent by account code and rejects hierarchy cycles. */
async function resolveParentId(
  parentAccountCode: string,
  organizationId: string,
  selfId?: string,
): Promise<string> {
  const parent = await prisma.chartOfAccounts.findFirst({
    where: { code: parentAccountCode, organizationId },
    select: { id: true, parentId: true },
  });
  if (!parent) {
    throw unprocessable(`Parent account code '${parentAccountCode}' not found`);
  }
  if (selfId) {
    if (parent.id === selfId) {
      throw unprocessable("An account cannot be its own parent");
    }
    // Walk up the existing chain: re-parenting an account under its own
    // descendant would orphan the subtree and make balances unreachable.
    let cursor: string | null = parent.id;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor)) {
      if (cursor === selfId) {
        throw unprocessable("An account cannot be parented under one of its own children");
      }
      seen.add(cursor);
      const node: { parentId: string | null } | null = await prisma.chartOfAccounts.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = node?.parentId ?? null;
    }
  }
  return parent.id;
}

export const chartOfAccountsService = {
  async create(data: { code: string; name: string; type: AccountType; parentAccountCode?: string; parentId?: string; isActive?: boolean; organizationId: string }) {
    const { parentAccountCode, parentId, ...rest } = data;
    let resolvedParentId: string | undefined;

    if (parentAccountCode) {
      const parentAccount = await prisma.chartOfAccounts.findFirst({
        where: { code: parentAccountCode, organizationId: data.organizationId, isActive: true },
        select: { id: true },
      });
      if (!parentAccount) {
        throw new Error(`Parent account code '${parentAccountCode}' not found`);
      }
      resolvedParentId = parentAccount.id;
    } else if (parentId) {
      resolvedParentId = parentId;
    }

    return prisma.chartOfAccounts.create({
      data: {
        ...rest,
        organizationId: data.organizationId,
        ...(resolvedParentId ? { parentId: resolvedParentId } : {}),
      },
    });
  },

  async list(page = 1, pageSize = 10, organizationId: string) {
    const [data, total] = await Promise.all([
      prisma.chartOfAccounts.findMany({
        where: { organizationId },
        orderBy: { code: "asc" },
        include: { parent: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.chartOfAccounts.count({ where: { organizationId } }),
    ]);
    return { data, total };
  },

  async getById(id: string, organizationId: string) {
    return prisma.chartOfAccounts.findFirst({
      where: { id, organizationId },
      include: { parent: true, children: true },
    });
  },

  async listChildren(parentId: string | null, page = 1, pageSize = 10, organizationId: string) {
    const where: any = { parentId, organizationId };
    const [data, total] = await Promise.all([
      prisma.chartOfAccounts.findMany({
        where,
        orderBy: { code: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.chartOfAccounts.count({ where }),
    ]);
    return { data, total };
  },

  /**
   * Edits an account: rename, re-code, change type, activate/deactivate, or
   * re-link it to a parent account. Parent links may be given either as
   * `parentAccountCode` (what the UI uses) or `parentId`, and an empty string
   * detaches the account.
   */
  async update(id: string, data: { code?: string; name?: string; type?: AccountType; parentId?: string; parentAccountCode?: string; isActive?: boolean }, organizationId: string) {
    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.parentAccountCode !== undefined) {
      if (data.parentAccountCode === "") {
        updateData.parentId = null;
      } else {
        updateData.parentId = await resolveParentId(data.parentAccountCode, organizationId, id);
      }
    } else if (data.parentId !== undefined) {
      if (data.parentId === "") {
        updateData.parentId = null;
      } else {
        if (data.parentId === id) {
          throw unprocessable("An account cannot be its own parent");
        }
        const parent = await prisma.chartOfAccounts.findFirst({
          where: { id: data.parentId, organizationId },
          select: { id: true },
        });
        if (!parent) throw unprocessable("Parent account not found in organization");
        updateData.parentId = data.parentId;
      }
    }

    return prisma.$transaction(
      async (tx) => {
        const result = await tx.chartOfAccounts.updateMany({
          where: { id, organizationId },
          data: updateData as never,
        });
        if (result.count === 0) {
          throw unprocessable("Account not found");
        }
        return tx.chartOfAccounts.findFirst({
          where: { id, organizationId },
          include: { parent: true, children: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10000 },
    );
  },

  async delete(id: string, organizationId: string) {
    const lineCount = await prisma.journalLine.count({
      where: {
        accountId: id,
        journalEntry: { organizationId },
      },
    });
    if (lineCount > 0) {
      throw new Error("Cannot delete account because it is referenced by journal entries.");
    }
    await prisma.chartOfAccounts.deleteMany({ where: { id, organizationId } });
  },
};
