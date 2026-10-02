import { prisma } from "../lib/prisma";
import { journalService, type PrismaLike } from "./journalService";
import { emitToOrganization } from "../index";

async function findAccountByType(
  organizationId: string,
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE",
  client?: PrismaLike,
): Promise<string | null> {
  const tx = (client ?? prisma) as PrismaLike;
  const account = await tx.chartOfAccounts.findFirst({
    where: { organizationId, type, isActive: true },
    orderBy: { code: "asc" },
    select: { id: true },
  });
  return account?.id ?? null;
}

export interface PostingParams {
  organizationId: string;
  createdById: string;
  amountInKobo: bigint;
  description: string;
  date?: Date;
  /**
   * Transaction client of the caller. When provided, the double entry is
   * written inside that transaction so the financial record and its journal
   * entry are atomic.
   */
  tx?: PrismaLike;
  ledgerEntryId?: string;
}

export async function postContributionJournalEntry(params: {
  organizationId: string;
  createdById: string;
  amountInKobo: bigint;
  fundId: string;
  ledgerEntryId: string;
  description: string;
  date?: Date;
  tx?: PrismaLike;
}): Promise<void> {
  const tx = params.tx;
  const [cashAccountId, incomeAccountId] = await Promise.all([
    findAccountByType(params.organizationId, "ASSET", tx),
    findAccountByType(params.organizationId, "INCOME", tx),
  ]);

  if (!cashAccountId || !incomeAccountId) return;

  const lines = [
    { accountId: cashAccountId, description: params.description, debitInKobo: params.amountInKobo, creditInKobo: BigInt(0) },
    { accountId: incomeAccountId, description: params.description, debitInKobo: BigInt(0), creditInKobo: params.amountInKobo },
  ];

  const entry = await journalService.createEntry(
    {
      organizationId: params.organizationId,
      date: params.date ?? new Date(),
      description: `Contribution: ${params.description}`,
      reference: params.fundId,
      createdById: params.createdById,
      lines,
    },
    tx,
  );

  // Inside a caller transaction the journal link must be written with the same
  // client; outside it, link and emit as before.
  if (tx) {
    await tx.ledgerEntry.update({
      where: { id: params.ledgerEntryId },
      data: { journalId: entry.id },
    });
  } else {
    await prisma.ledgerEntry.update({
      where: { id: params.ledgerEntryId },
      data: { journalId: entry.id },
    });
  }

  if (!tx) {
    emitToOrganization(params.organizationId, "journal:posted", { entry });
  }
}

export async function postDisbursementJournalEntry(params: PostingParams): Promise<void> {
  const tx = params.tx;
  const [expenseAccountId, cashAccountId] = await Promise.all([
    findAccountByType(params.organizationId, "EXPENSE", tx),
    findAccountByType(params.organizationId, "ASSET", tx),
  ]);

  if (!expenseAccountId || !cashAccountId) return;

  const lines = [
    { accountId: expenseAccountId, description: params.description, debitInKobo: params.amountInKobo, creditInKobo: BigInt(0) },
    { accountId: cashAccountId, description: params.description, debitInKobo: BigInt(0), creditInKobo: params.amountInKobo },
  ];

  const entry = await journalService.createEntry(
    {
      organizationId: params.organizationId,
      date: params.date ?? new Date(),
      description: `Disbursement: ${params.description}`,
      createdById: params.createdById,
      lines,
    },
    tx,
  );

  if (!tx) {
    emitToOrganization(params.organizationId, "journal:posted", { entry });
  }
}
