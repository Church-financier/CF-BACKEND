import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

const DEFAULT_CHART_OF_ACCOUNTS: Array<{
  code: string;
  name: string;
  type: Prisma.AccountType;
  parentCode?: string;
}> = [
  { code: "1000", name: "Cash/Bank", type: "ASSET" },
  { code: "1100", name: "Accounts Receivable", type: "ASSET" },
  { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
  { code: "3000", name: "Equity", type: "EQUITY" },
  { code: "4000", name: "Income", type: "INCOME" },
  { code: "5000", name: "Expenses", type: "EXPENSE" },
];

export async function seedChartOfAccounts(organizationId: string): Promise<void> {
  const existing = await prisma.chartOfAccounts.findMany({
    where: { organizationId },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map((a) => a.code));
  if (existingCodes.size > 0) {
    return;
  }

  const codeToId = new Map<string, string>();

  for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
    if (existingCodes.has(account.code)) continue;
    const created = await prisma.chartOfAccounts.create({
      data: {
        code: account.code,
        name: account.name,
        type: account.type,
        organizationId,
        ...(account.parentCode && codeToId.has(account.parentCode)
          ? { parentId: codeToId.get(account.parentCode) }
          : {}),
      },
      select: { id: true, code: true },
    });
    codeToId.set(created.code, created.id);
  }
}

export async function seedFunds(organizationId: string): Promise<void> {
  const existing = await prisma.fund.findFirst({
    where: { organizationId },
    select: { id: true },
  });
  if (existing) return;

  await prisma.fund.createMany({
    data: [
      { name: "General Fund", organizationId },
      { name: "Building Fund", organizationId },
      { name: "Welfare Fund", organizationId },
    ],
  });
}

export async function seedOrganization(organizationId: string): Promise<void> {
  await seedChartOfAccounts(organizationId);
  await seedFunds(organizationId);
}

export async function main(): Promise<void> {
  const orgId = process.argv[2];
  if (!orgId) {
    console.error("Usage: npx prisma db seed -- <organizationId>");
    process.exit(1);
  }

  console.log(`Seeding organization ${orgId}...`);
  await seedOrganization(orgId);
  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
