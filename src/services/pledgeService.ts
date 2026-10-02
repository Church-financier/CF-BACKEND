import { prisma } from "../lib/prisma";

async function resolveMemberId(identifier: string, organizationId: string): Promise<string> {
  const member = await prisma.member.findFirst({
    where: {
      organizationId,
      isActive: true,
      OR: [{ id: identifier }, { memberNumber: identifier }],
    },
    select: { id: true },
  });
  if (!member) throw new Error("Active member not found in organization");
  return member.id;
}

export const pledgeService = {
  async create(data: {
    memberId?: string;
    memberName: string;
    fundId: string;
    amountInKobo: bigint;
    startDate?: string;
    endDate?: string;
    recurring?: boolean;
    organizationId: string;
  }) {
    const normalized: any = {
      ...data,
      ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
      memberName: data.memberName,
    };

    if (data.memberId && data.memberId.trim() !== "") {
      normalized.memberId = await resolveMemberId(data.memberId.trim(), data.organizationId);
    } else {
      normalized.memberId = null;
    }

    const fund = await prisma.fund.findFirst({
      where: { id: data.fundId, organizationId: data.organizationId },
      select: { id: true },
    });
    if (!fund) throw new Error("Fund not found in organization");

    return prisma.pledge.create({ data: normalized });
  },

  async listAll(page = 1, pageSize = 10, organizationId: string) {
    const [data, total] = await Promise.all([
      prisma.pledge.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: {
          fund: { select: { name: true } },
          member: { select: { id: true, memberNumber: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.pledge.count({ where: { organizationId } }),
    ]);
    const receivedByPledge = data.length
      ? await prisma.pledgeContribution.groupBy({
        by: ["pledgeId"],
        where: {
          organizationId,
          pledgeId: { in: data.map((pledge) => pledge.id) },
          ledgerEntry: { type: "DONATION", reversedById: null },
        },
        _sum: { amountInKobo: true },
      })
      : [];
    const receivedMap = new Map(receivedByPledge.map((item) => [item.pledgeId, item._sum.amountInKobo ?? BigInt(0)]));
    return {
      data: data.map((pledge) => {
        const received = receivedMap.get(pledge.id) ?? BigInt(0);
        return {
          ...pledge,
          status: pledge.status === "CANCELLED" ? "CANCELLED" : received >= pledge.amountInKobo ? "COMPLETED" : "ACTIVE",
          totalReceivedInKobo: received.toString(),
          remainingInKobo: (pledge.amountInKobo > received ? pledge.amountInKobo - received : BigInt(0)).toString(),
          fulfilled: received >= pledge.amountInKobo,
        };
      }),
      total,
    };
  },

  async listByMember(memberId: string, page = 1, pageSize = 10, organizationId: string) {
    const [data, total] = await Promise.all([
      prisma.pledge.findMany({
        where: { memberId, organizationId },
        orderBy: { createdAt: "desc" },
        include: { fund: { select: { name: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.pledge.count({ where: { memberId, organizationId } }),
    ]);
    return { data, total };
  },

  async getById(id: string, organizationId: string) {
    return prisma.pledge.findFirst({
      where: { id, organizationId },
      include: {
        fund: { select: { name: true } },
        contributions: {
          include: { ledgerEntry: { select: { id: true, createdAt: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async update(
    id: string,
    data: { memberId?: string; memberName?: string; fundId?: string; amountInKobo?: bigint; startDate?: string; endDate?: string; recurring?: boolean },
    organizationId: string
  ) {
    const normalized: any = {};
    if (data.memberName !== undefined) normalized.memberName = data.memberName;
    if (data.memberId !== undefined) {
      if (!data.memberId) normalized.memberId = null;
      else {
        normalized.memberId = await resolveMemberId(data.memberId, organizationId);
      }
    }
    if (data.fundId !== undefined) {
      const fund = await prisma.fund.findFirst({ where: { id: data.fundId, organizationId }, select: { id: true } });
      if (!fund) throw new Error("Fund not found in organization");
      normalized.fundId = data.fundId;
    }
    if (data.amountInKobo !== undefined) normalized.amountInKobo = data.amountInKobo;
    if (data.startDate !== undefined) normalized.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) normalized.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.recurring !== undefined) normalized.recurring = data.recurring;
    await prisma.$transaction(async (tx) => {
      const pledge = await tx.pledge.findFirst({ where: { id, organizationId } });
      if (!pledge) throw new Error("Pledge not found");
      await tx.pledge.update({ where: { id }, data: normalized });
      if (pledge.status !== "CANCELLED" && data.amountInKobo !== undefined) {
        const received = await tx.pledgeContribution.aggregate({
          where: { pledgeId: id, organizationId, ledgerEntry: { type: "DONATION", reversedById: null } },
          _sum: { amountInKobo: true },
        });
        await tx.pledge.update({ where: { id }, data: { status: (received._sum?.amountInKobo ?? BigInt(0)) >= data.amountInKobo ? "COMPLETED" : "ACTIVE" } });
      }
    });
    return prisma.pledge.findFirst({ where: { id, organizationId } });
  },

  async cancel(id: string, organizationId: string) {
    const existing = await prisma.pledge.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!existing) throw new Error("Pledge not found");
    await prisma.pledge.update({ where: { id: existing.id }, data: { status: "CANCELLED" } });
    return prisma.pledge.findFirst({ where: { id, organizationId } });
  },

  async getProgress(pledgeId: string, organizationId: string) {
    const pledge = await prisma.pledge.findFirst({ where: { id: pledgeId, organizationId } });
    if (!pledge) throw new Error("Pledge not found");

    const received = await prisma.pledgeContribution.aggregate({
      where: { pledgeId, organizationId, ledgerEntry: { type: "DONATION", reversedById: null } },
      _sum: { amountInKobo: true },
    });
    const totalReceived = received._sum.amountInKobo ?? BigInt(0);
    const remaining = pledge.amountInKobo > totalReceived ? pledge.amountInKobo - totalReceived : BigInt(0);
    const percentage = pledge.amountInKobo > BigInt(0)
      ? Math.min(100, Math.round(Number((totalReceived * BigInt(10000)) / pledge.amountInKobo) / 100))
      : 0;

    return {
      pledged: pledge.amountInKobo.toString(),
      received: totalReceived.toString(),
      remaining: remaining.toString(),
      percentage,
      fulfilled: totalReceived >= pledge.amountInKobo,
    };
  },
};
