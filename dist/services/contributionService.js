"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contributionService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const index_1 = require("../index");
const mailerService_1 = require("./mailerService");
const postingService_1 = require("./postingService");
const fiscalYear_1 = require("../utils/fiscalYear");
const systemSettingsService_1 = require("./systemSettingsService");
/**
 * Serializes pledge fulfilment.
 *
 * The pledge row is locked FOR UPDATE before its running total is read, so two
 * contributions recorded at the same moment cannot both read a stale balance
 * and leave the pledge short of (or double-counted against) its target.
 */
async function lockPledgeForUpdate(tx, organizationId, pledgeId) {
    const rows = await tx.$queryRaw `
    SELECT "id", "status", "amountInKobo"::text AS "amountInKobo", "fundId", "memberId"
    FROM "Pledge"
    WHERE "id" = ${pledgeId} AND "organizationId" = ${organizationId}
    FOR UPDATE
  `;
    if (rows.length === 0)
        return null;
    return rows[0];
}
async function applyPledgeLink(tx, organizationId, pledgeId, ledgerEntryId, amountInKobo, recordedById, memberId, fundId) {
    const pledge = await lockPledgeForUpdate(tx, organizationId, pledgeId);
    if (!pledge || pledge.status === "CANCELLED")
        throw new Error("Active pledge not found in organization");
    if (pledge.fundId !== fundId || (pledge.memberId && pledge.memberId !== memberId)) {
        throw new Error("Contribution must match the pledge member and fund");
    }
    await tx.pledgeContribution.create({
        data: { organizationId, pledgeId, ledgerEntryId, amountInKobo, recordedById },
    });
    await refreshPledgeStatus(tx, organizationId, pledgeId);
}
async function refreshPledgeStatus(tx, organizationId, pledgeId) {
    const pledge = await tx.pledge.findFirst({ where: { id: pledgeId, organizationId } });
    if (!pledge || pledge.status === "CANCELLED")
        return;
    const aggregated = await tx.pledgeContribution.aggregate({
        where: { pledgeId, organizationId, ledgerEntry: { type: "DONATION", reversedById: null } },
        _sum: { amountInKobo: true },
    });
    const total = aggregated._sum?.amountInKobo ?? BigInt(0);
    await tx.pledge.update({ where: { id: pledgeId, organizationId }, data: { status: total >= pledge.amountInKobo ? "COMPLETED" : "ACTIVE" } });
}
async function ensureContributionPeriodOpen(organizationId, date) {
    const settings = await (0, systemSettingsService_1.getOrgSettings)(organizationId);
    const startMonth = settings?.fiscalYearStartMonth ?? 1;
    const fiscalYear = (0, fiscalYear_1.fiscalYearOf)(date, startMonth);
    const month = (0, fiscalYear_1.fiscalMonthOf)(date, startMonth);
    const period = await prisma_1.prisma.period.findUnique({
        where: { organizationId_fiscalYear_month: { organizationId, fiscalYear, month } },
    });
    if (period?.isLocked) {
        throw new Error(`Period ${fiscalYear}-${String(month).padStart(2, "0")} is locked. Unlock it before changing contributions.`);
    }
}
exports.contributionService = {
    async listFunds(organizationId) {
        return prisma_1.prisma.fund.findMany({
            where: { organizationId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        });
    },
    async createSingle(input) {
        const transactionDate = input.date ?? new Date();
        await ensureContributionPeriodOpen(input.organizationId, transactionDate);
        const fund = await prisma_1.prisma.fund.findFirst({
            where: { id: input.fundId, organizationId: input.organizationId },
            select: { id: true },
        });
        if (!fund)
            throw new Error("Fund not found in organization");
        let memberId = null;
        let resolvedMemberName = input.memberName || "Anonymous";
        if (input.memberId) {
            const member = await prisma_1.prisma.member.findFirst({
                where: {
                    organizationId: input.organizationId,
                    isActive: true,
                    OR: [
                        { id: input.memberId },
                        { memberNumber: input.memberId },
                    ],
                },
                select: { id: true, fullName: true },
            });
            if (!member)
                throw new Error("Member not found in organization");
            memberId = member.id;
            resolvedMemberName = input.memberName || member.fullName;
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const entry = await tx.ledgerEntry.create({
                data: {
                    organizationId: input.organizationId,
                    fundId: input.fundId,
                    type: "DONATION",
                    amountInKobo: input.amountInKobo,
                    description: `${input.type} contribution from ${resolvedMemberName}${input.notes ? ` — ${input.notes}` : ""}`,
                    recordedById: input.recordedById,
                    memberId,
                    transactionDate,
                    contributionMethod: input.type,
                    notes: input.notes,
                },
            });
            if (input.pledgeId) {
                await applyPledgeLink(tx, input.organizationId, input.pledgeId, entry.id, input.amountInKobo, input.recordedById, memberId, input.fundId);
            }
            // The income double entry is written in the same SERIALIZABLE
            // transaction: the ledger row and its journal entry either both exist
            // or neither does.
            await (0, postingService_1.postContributionJournalEntry)({
                tx,
                organizationId: input.organizationId,
                createdById: input.recordedById,
                amountInKobo: input.amountInKobo,
                fundId: input.fundId,
                ledgerEntryId: entry.id,
                description: entry.description,
                date: transactionDate,
            });
            return entry;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
        (0, index_1.emitToOrganization)(input.organizationId, "contribution:created", { entries: [result], count: 1 });
        void sendReceiptIfPossible(input.organizationId, memberId ?? "", resolvedMemberName, result.id, input.amountInKobo);
        return result;
    },
    async batchCreate(data) {
        await Promise.all(data.entries.map((entry) => ensureContributionPeriodOpen(data.organizationId, entry.date ? new Date(entry.date) : new Date())));
        const fundIds = [...new Set(data.entries.map((e) => e.fundId))];
        const funds = await prisma_1.prisma.fund.findMany({
            where: { id: { in: fundIds }, organizationId: data.organizationId },
            select: { id: true },
        });
        if (funds.length !== fundIds.length) {
            throw new Error("One or more funds not found in organization");
        }
        const memberIds = data.entries.map((e) => e.memberId).filter((id) => !!id);
        const memberIdByIdentifier = new Map();
        const memberNameByIdentifier = new Map();
        if (memberIds.length > 0) {
            const members = await prisma_1.prisma.member.findMany({
                where: {
                    organizationId: data.organizationId,
                    isActive: true,
                    OR: [
                        { id: { in: memberIds } },
                        { memberNumber: { in: memberIds } },
                    ],
                },
                select: { id: true, memberNumber: true, fullName: true },
            });
            const validIdentifiers = new Set();
            for (const member of members) {
                validIdentifiers.add(member.id);
                memberIdByIdentifier.set(member.id, member.id);
                memberNameByIdentifier.set(member.id, member.fullName);
                if (member.memberNumber) {
                    validIdentifiers.add(member.memberNumber);
                    memberIdByIdentifier.set(member.memberNumber, member.id);
                    memberNameByIdentifier.set(member.memberNumber, member.fullName);
                }
            }
            const missingIds = memberIds.filter((id) => !validIdentifiers.has(id));
            if (missingIds.length > 0) {
                throw new Error(`One or more members not found in organization: ${missingIds.join(', ')}`);
            }
        }
        const entries = await prisma_1.prisma.$transaction(async (tx) => {
            // Lock every pledge this batch touches in a stable order before
            // creating rows, so two concurrent batches cannot deadlock on each
            // other's pledges.
            const batchPledgeIds = [...new Set(data.entries.map((e) => e.pledgeId).filter((v) => !!v))].sort();
            for (const batchPledgeId of batchPledgeIds) {
                await lockPledgeForUpdate(tx, data.organizationId, batchPledgeId);
            }
            const created = [];
            for (const entry of data.entries) {
                const e = await tx.ledgerEntry.create({
                    data: {
                        organizationId: data.organizationId,
                        fundId: entry.fundId,
                        type: "DONATION",
                        amountInKobo: entry.amountInKobo,
                        description: `${entry.type} contribution from ${entry.memberName || (entry.memberId ? memberNameByIdentifier.get(entry.memberId) || entry.memberId : "Anonymous")}${entry.notes ? ` — ${entry.notes}` : ""}`,
                        recordedById: data.recordedById,
                        memberId: entry.memberId ? memberIdByIdentifier.get(entry.memberId) ?? entry.memberId : null,
                        transactionDate: entry.date ? new Date(entry.date) : new Date(),
                        contributionMethod: entry.type,
                        notes: entry.notes,
                    },
                });
                if (entry.pledgeId) {
                    const memberId = entry.memberId ? memberIdByIdentifier.get(entry.memberId) ?? null : null;
                    await applyPledgeLink(tx, data.organizationId, entry.pledgeId, e.id, entry.amountInKobo, data.recordedById, memberId, entry.fundId);
                }
                await (0, postingService_1.postContributionJournalEntry)({
                    tx,
                    organizationId: data.organizationId,
                    createdById: data.recordedById,
                    amountInKobo: e.amountInKobo,
                    fundId: e.fundId,
                    ledgerEntryId: e.id,
                    description: e.description,
                    date: entry.date ? new Date(entry.date) : undefined,
                });
                created.push(e);
            }
            return created;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
        (0, index_1.emitToOrganization)(data.organizationId, "contribution:created", { entries, count: entries.length });
        for (let i = 0; i < entries.length; i++) {
            const src = data.entries[i];
            void sendReceiptIfPossible(data.organizationId, src.memberId ? memberIdByIdentifier.get(src.memberId) ?? "" : "", src.memberName || (src.memberId ? memberNameByIdentifier.get(src.memberId) : undefined), entries[i].id, entries[i].amountInKobo);
        }
        return entries;
    },
    async listAll(page = 1, pageSize = 10, organizationId) {
        const [data, total] = await Promise.all([
            prisma_1.prisma.ledgerEntry.findMany({
                where: { type: "DONATION", organizationId, reversedById: null },
                orderBy: { transactionDate: "desc" },
                include: {
                    fund: { select: { name: true } },
                    member: { select: { id: true, fullName: true, memberNumber: true } },
                    pledgeContributions: { select: { pledgeId: true } },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.ledgerEntry.count({ where: { type: "DONATION", organizationId, reversedById: null } }),
        ]);
        return { data, total };
    },
    async getById(id, organizationId) {
        return prisma_1.prisma.ledgerEntry.findFirst({
            where: { id, organizationId, type: "DONATION" },
            include: { fund: true, member: true, recordedBy: { select: { name: true, email: true } } },
        });
    },
    async updateContribution(id, data, organizationId, recordedById) {
        const current = await prisma_1.prisma.ledgerEntry.findFirst({
            where: { id, organizationId, type: "DONATION" },
            include: { pledgeContributions: true, member: { select: { fullName: true } } },
        });
        if (!current)
            throw new Error("Contribution not found");
        if (current.reversedById)
            throw new Error("A reversed contribution cannot be edited");
        const transactionDate = data.date ?? current.transactionDate;
        await ensureContributionPeriodOpen(organizationId, current.transactionDate);
        await ensureContributionPeriodOpen(organizationId, transactionDate);
        const fundId = data.fundId ?? current.fundId;
        const fund = await prisma_1.prisma.fund.findFirst({ where: { id: fundId, organizationId }, select: { id: true } });
        if (!fund)
            throw new Error("Fund not found in organization");
        let memberId = current.memberId;
        let resolvedMemberName = data.memberName ?? current.member?.fullName ?? "Anonymous";
        if (data.memberId !== undefined) {
            if (!data.memberId) {
                memberId = null;
                resolvedMemberName = data.memberName || "Anonymous";
            }
            else {
                const member = await prisma_1.prisma.member.findFirst({
                    where: { organizationId, isActive: true, OR: [{ id: data.memberId }, { memberNumber: data.memberId }] },
                    select: { id: true, fullName: true },
                });
                if (!member)
                    throw new Error("Member not found in organization");
                memberId = member.id;
                resolvedMemberName = data.memberName ?? member.fullName;
            }
        }
        const pledgeId = data.pledgeId ?? current.pledgeContributions[0]?.pledgeId;
        if (pledgeId) {
            const pledge = await prisma_1.prisma.pledge.findFirst({ where: { id: pledgeId, organizationId } });
            if (!pledge || pledge.status === "CANCELLED")
                throw new Error("Active pledge not found in organization");
            if (pledge.fundId !== fundId || (pledge.memberId && pledge.memberId !== memberId)) {
                throw new Error("Contribution must match the pledge member and fund");
            }
        }
        const amountInKobo = data.amountInKobo ?? current.amountInKobo;
        const contributionMethod = data.type ?? current.contributionMethod ?? "CASH";
        const notes = data.notes ?? current.notes ?? undefined;
        const description = `${contributionMethod} contribution from ${resolvedMemberName}${notes ? ` — ${notes}` : ""}`;
        const priorPledgeId = current.pledgeContributions[0]?.pledgeId;
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            // Lock the pledges whose running totals this edit changes, so a
            // concurrent fulfilment cannot interleave with the re-link below.
            const touchedPledgeIds = [...new Set([priorPledgeId, pledgeId].filter((v) => !!v))];
            for (const touchedPledgeId of touchedPledgeIds) {
                await lockPledgeForUpdate(tx, organizationId, touchedPledgeId);
            }
            // Lock the contribution itself so a concurrent reversal cannot win the
            // race between the read above and this write.
            const lockedEntry = await tx.$queryRaw `
          SELECT "id" FROM "LedgerEntry" WHERE "id" = ${id} AND "organizationId" = ${organizationId} FOR UPDATE
        `;
            if (lockedEntry.length === 0)
                throw new Error("Contribution not found");
            const entry = await tx.ledgerEntry.update({
                where: { id },
                data: { fundId, amountInKobo, memberId, transactionDate, contributionMethod, notes, description },
            });
            if (current.journalId) {
                const journal = await tx.journalEntry.findFirst({ where: { id: current.journalId, organizationId }, include: { lines: true } });
                if (!journal || journal.status !== "POSTED" || journal.lines.length < 2) {
                    throw new Error("The linked journal entry cannot be edited");
                }
                await tx.journalEntry.update({ where: { id: journal.id }, data: { date: transactionDate, reference: fundId, description: `Contribution: ${description}` } });
                for (const line of journal.lines) {
                    await tx.journalLine.update({
                        where: { id: line.id },
                        data: {
                            description,
                            debitInKobo: line.debitInKobo > BigInt(0) ? amountInKobo : BigInt(0),
                            creditInKobo: line.creditInKobo > BigInt(0) ? amountInKobo : BigInt(0),
                        },
                    });
                }
            }
            const pledgeLink = await tx.pledgeContribution.findFirst({ where: { ledgerEntryId: id, organizationId } });
            if (pledgeId) {
                if (pledgeLink) {
                    await tx.pledgeContribution.update({ where: { id: pledgeLink.id }, data: { pledgeId, amountInKobo, recordedById } });
                }
                else {
                    await tx.pledgeContribution.create({ data: { organizationId, pledgeId, ledgerEntryId: id, amountInKobo, recordedById } });
                }
            }
            else if (pledgeLink) {
                await tx.pledgeContribution.delete({ where: { id: pledgeLink.id } });
            }
            if (priorPledgeId)
                await refreshPledgeStatus(tx, organizationId, priorPledgeId);
            if (pledgeId && pledgeId !== priorPledgeId)
                await refreshPledgeStatus(tx, organizationId, pledgeId);
            await tx.auditLog.create({
                data: {
                    organizationId,
                    userId: recordedById,
                    action: "CONTRIBUTION_UPDATE",
                    details: {
                        contributionId: id,
                        previous: { amountInKobo: current.amountInKobo.toString(), fundId: current.fundId, memberId: current.memberId, transactionDate: current.transactionDate.toISOString() },
                        updated: { amountInKobo: amountInKobo.toString(), fundId, memberId, transactionDate: transactionDate.toISOString() },
                    },
                },
            });
            return entry;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
        (0, index_1.emitToOrganization)(organizationId, "contribution:updated", { entry: updated });
        return updated;
    },
    async deleteContribution(id, organizationId, recordedById, reason) {
        const current = await prisma_1.prisma.ledgerEntry.findFirst({
            where: { id, organizationId, type: "DONATION" },
            include: { pledgeContributions: true, journal: { include: { lines: true } } },
        });
        if (!current)
            throw new Error("Contribution not found");
        if (current.reversedById)
            throw new Error("Contribution has already been reversed");
        await ensureContributionPeriodOpen(organizationId, current.transactionDate);
        await ensureContributionPeriodOpen(organizationId, new Date());
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // Lock the contribution and the pledges it feeds, so a concurrent
            // reversal of the same row cannot create two reversing entries.
            const locked = await tx.$queryRaw `
          SELECT "id", "reversedById" FROM "LedgerEntry" WHERE "id" = ${id} AND "organizationId" = ${organizationId} FOR UPDATE
        `;
            if (locked.length === 0)
                throw new Error("Contribution not found");
            if (locked[0].reversedById) {
                throw new Error("Contribution has already been reversed");
            }
            const pledgeIds = [...new Set(current.pledgeContributions.map((link) => link.pledgeId))];
            for (const pledgeId of pledgeIds) {
                await lockPledgeForUpdate(tx, organizationId, pledgeId);
            }
            let reversalJournalId;
            if (current.journal) {
                if (current.journal.status !== "POSTED" || current.journal.lines.length < 2) {
                    throw new Error("The linked journal entry cannot be reversed");
                }
                const reversalJournal = await tx.journalEntry.create({
                    data: {
                        organizationId,
                        date: new Date(),
                        description: `REVERSAL of ${current.journal.id}: ${reason}`,
                        reference: current.journal.reference ? `REV-${current.journal.reference}` : undefined,
                        createdById: recordedById,
                        lines: {
                            create: current.journal.lines.map((line) => ({
                                accountId: line.accountId,
                                description: line.description,
                                debitInKobo: line.creditInKobo,
                                creditInKobo: line.debitInKobo,
                            })),
                        },
                    },
                });
                const flipped = await tx.journalEntry.updateMany({
                    where: { id: current.journal.id, status: "POSTED" },
                    data: { status: "REVERSED" },
                });
                if (flipped.count !== 1) {
                    throw new Error("The linked journal entry cannot be reversed");
                }
                reversalJournalId = reversalJournal.id;
            }
            const reversal = await tx.ledgerEntry.create({
                data: {
                    organizationId,
                    fundId: current.fundId,
                    type: "REVERSAL",
                    amountInKobo: -current.amountInKobo,
                    description: `REVERSED: ${current.description} — ${reason}`,
                    recordedById,
                    transactionDate: new Date(),
                    journalId: reversalJournalId,
                },
            });
            // Conditional write: if another request already linked a reversal, the
            // unique `reversedById` column and this count check both refuse it.
            const linked = await tx.ledgerEntry.updateMany({
                where: { id, organizationId, reversedById: null },
                data: { reversedById: reversal.id },
            });
            if (linked.count !== 1) {
                throw new Error("Contribution has already been reversed");
            }
            await tx.pledgeContribution.deleteMany({ where: { ledgerEntryId: id, organizationId } });
            for (const pledgeId of pledgeIds) {
                await refreshPledgeStatus(tx, organizationId, pledgeId);
            }
            await tx.auditLog.create({ data: { organizationId, userId: recordedById, action: "CONTRIBUTION_DELETE", details: { contributionId: id, reversalId: reversal.id, reason } } });
            return { originalId: id, reversalId: reversal.id };
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
        (0, index_1.emitToOrganization)(organizationId, "contribution:deleted", result);
        return result;
    },
    async getMemberStatement(memberId, organizationId) {
        const member = await prisma_1.prisma.member.findFirst({
            where: { id: memberId, organizationId },
            select: { id: true, fullName: true, memberNumber: true },
        });
        if (!member)
            return null;
        const [entries, total] = await Promise.all([
            prisma_1.prisma.ledgerEntry.findMany({
                where: { organizationId, memberId, type: "DONATION", reversedById: null },
                orderBy: { transactionDate: "desc" },
                include: { fund: { select: { id: true, name: true } } },
            }),
            prisma_1.prisma.ledgerEntry.aggregate({
                where: { organizationId, memberId, type: "DONATION", reversedById: null },
                _sum: { amountInKobo: true },
            }),
        ]);
        return {
            member,
            totalContributedInKobo: (total._sum?.amountInKobo ?? BigInt(0)).toString(),
            contributions: entries,
        };
    },
    async getIncomeOverview(organizationId) {
        const settings = await (0, systemSettingsService_1.getOrgSettings)(organizationId);
        const startMonth = settings?.fiscalYearStartMonth ?? 1;
        const now = new Date();
        const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const weekday = startOfWeek.getUTCDay();
        startOfWeek.setUTCDate(startOfWeek.getUTCDate() - ((weekday + 6) % 7));
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const startOfYear = (0, fiscalYear_1.fiscalYearStart)(now, startMonth);
        const donationWhere = { organizationId, type: "DONATION", reversedById: null };
        const [weekly, monthly, ytd, byFund, byMember, recent, outstandingPledges, memberCount, activePledges] = await Promise.all([
            prisma_1.prisma.ledgerEntry.aggregate({ where: { ...donationWhere, transactionDate: { gte: startOfWeek, lte: now } }, _sum: { amountInKobo: true } }),
            prisma_1.prisma.ledgerEntry.aggregate({ where: { ...donationWhere, transactionDate: { gte: startOfMonth, lte: now } }, _sum: { amountInKobo: true } }),
            prisma_1.prisma.ledgerEntry.aggregate({ where: { ...donationWhere, transactionDate: { gte: startOfYear, lte: now } }, _sum: { amountInKobo: true } }),
            prisma_1.prisma.ledgerEntry.groupBy({ by: ["fundId"], where: { ...donationWhere, transactionDate: { gte: startOfYear, lte: now } }, _sum: { amountInKobo: true } }),
            prisma_1.prisma.ledgerEntry.groupBy({ by: ["memberId"], where: { ...donationWhere, memberId: { not: null }, transactionDate: { gte: startOfYear, lte: now } }, _sum: { amountInKobo: true }, _count: { _all: true } }),
            prisma_1.prisma.ledgerEntry.findMany({ where: donationWhere, orderBy: { transactionDate: "desc" }, take: 10, include: { fund: { select: { id: true, name: true } }, member: { select: { id: true, fullName: true, memberNumber: true } } } }),
            prisma_1.prisma.pledge.aggregate({ where: { organizationId, status: "ACTIVE" }, _sum: { amountInKobo: true } }),
            prisma_1.prisma.member.count({ where: { organizationId, isActive: true } }),
            prisma_1.prisma.pledge.count({ where: { organizationId, status: "ACTIVE" } }),
        ]);
        const fundIds = byFund.map((item) => item.fundId);
        const memberIds = byMember.map((item) => item.memberId).filter((id) => id !== null);
        const [funds, members] = await Promise.all([
            prisma_1.prisma.fund.findMany({ where: { id: { in: fundIds }, organizationId }, select: { id: true, name: true } }),
            prisma_1.prisma.member.findMany({ where: { id: { in: memberIds }, organizationId }, select: { id: true, fullName: true, memberNumber: true } }),
        ]);
        const fundNames = new Map(funds.map((item) => [item.id, item.name]));
        const memberDetails = new Map(members.map((item) => [item.id, item]));
        const receivedOnPledges = await prisma_1.prisma.pledgeContribution.aggregate({
            where: { organizationId, pledge: { status: "ACTIVE" }, ledgerEntry: { type: "DONATION", reversedById: null } },
            _sum: { amountInKobo: true },
        });
        const memberStats = byMember.map((item) => {
            const member = item.memberId ? memberDetails.get(item.memberId) : undefined;
            return member ? { ...member, amountInKobo: (item._sum.amountInKobo ?? BigInt(0)).toString(), contributionCount: item._count._all } : null;
        }).filter((item) => item !== null)
            .sort((left, right) => BigInt(left.amountInKobo) > BigInt(right.amountInKobo) ? -1 : BigInt(left.amountInKobo) < BigInt(right.amountInKobo) ? 1 : 0);
        const categories = byFund.map((item) => ({ fundId: item.fundId, name: fundNames.get(item.fundId) ?? "Unknown", amountInKobo: (item._sum.amountInKobo ?? BigInt(0)).toString() }))
            .sort((left, right) => BigInt(left.amountInKobo) > BigInt(right.amountInKobo) ? -1 : BigInt(left.amountInKobo) < BigInt(right.amountInKobo) ? 1 : 0);
        const pledgedAmount = outstandingPledges._sum?.amountInKobo ?? BigInt(0);
        const receivedAmount = receivedOnPledges._sum?.amountInKobo ?? BigInt(0);
        return {
            weeklyContributions: (weekly._sum.amountInKobo ?? BigInt(0)).toString(),
            monthlyContributions: (monthly._sum.amountInKobo ?? BigInt(0)).toString(),
            ytdContributions: (ytd._sum.amountInKobo ?? BigInt(0)).toString(),
            outstandingPledges: (pledgedAmount > receivedAmount ? pledgedAmount - receivedAmount : BigInt(0)).toString(),
            memberCount,
            activePledges,
            categories,
            memberStats,
            recentEntries: recent,
        };
    },
    async getReceiptData(ledgerEntryId, organizationId) {
        const entry = await prisma_1.prisma.ledgerEntry.findFirst({
            where: { id: ledgerEntryId, organizationId, type: "DONATION", reversedById: null },
            include: { fund: true, recordedBy: { select: { name: true, email: true } }, organization: true },
        });
        if (!entry)
            throw new Error("Contribution not found");
        return {
            entryId: entry.id,
            fundId: entry.fundId,
            fundName: entry.fund?.name || "Unknown Fund",
            amountInKobo: entry.amountInKobo.toString(),
            date: entry.transactionDate,
            description: entry.description,
            contributionMethod: entry.contributionMethod,
            recordedBy: entry.recordedBy,
            organization: {
                id: entry.organization.id,
                name: entry.organization.name,
                address: entry.organization.address,
                phone: entry.organization.phone,
                email: entry.organization.email,
                timezone: entry.organization.timezone,
                currency: entry.organization.currency,
            },
        };
    },
};
async function sendReceiptIfPossible(organizationId, memberId, memberName, ledgerEntryId, amountInKobo) {
    try {
        const member = await prisma_1.prisma.member.findFirst({
            where: { id: memberId, organizationId },
            select: { email: true, fullName: true },
        });
        const email = member?.email;
        if (!email)
            return;
        const entry = await prisma_1.prisma.ledgerEntry.findFirst({
            where: { id: ledgerEntryId, organizationId },
            include: { fund: { select: { name: true } }, organization: { select: { name: true, currency: true } } },
        });
        if (!entry)
            return;
        await mailerService_1.mailerService.sendReceipt({
            email,
            donorName: member?.fullName || memberName || "Donor",
            amountInKobo: amountInKobo.toString(),
            fundName: entry.fund?.name ?? "General",
            receiptNumber: entry.id.slice(0, 8).toUpperCase(),
            date: entry.createdAt,
            organizationName: entry.organization?.name ?? "Church Financier",
            currency: entry.organization?.currency,
        });
    }
    catch (err) {
        console.error("[receipt email error]", err);
    }
}
//# sourceMappingURL=contributionService.js.map