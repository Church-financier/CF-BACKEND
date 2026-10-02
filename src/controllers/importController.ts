import { Response } from "express";
import { TenantRequest } from "../middleware/tenantMiddleware";
import { prisma } from "../lib/prisma";
import { parseImportFile, ImportResult } from "../services/importService";

function fail(result: ImportResult, row: number, message: string): ImportResult {
  result.failed++;
  result.errors.push({ row, message });
  return result;
}

export const importMembers = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const file = (req as any).file as Buffer | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  let rows;
  try {
    rows = await parseImportFile(file, (req as any).file?.originalname || "upload.csv");
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Failed to parse file" });
  }

  const result: ImportResult = { imported: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const fullName = String(row.fullName || row.name || "").trim();
    const email = row.email ? String(row.email).trim() : undefined;
    const phone = row.phone ? String(row.phone).trim() : undefined;
    const address = row.address ? String(row.address).trim() : undefined;
    const memberNumber = row.memberNumber ? String(row.memberNumber).trim() : undefined;

    if (!fullName) {
      fail(result, rowNum, "fullName is required");
      continue;
    }

    try {
      await prisma.member.create({
        data: {
          organizationId: user!.organizationId,
          fullName,
          email,
          phone,
          address,
          memberNumber,
        },
      });
      result.imported++;
    } catch (err) {
      fail(result, rowNum, err instanceof Error ? err.message : "Failed to create member");
    }
  }

  return res.status(200).json(result);
};

export const importLedgerEntries = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const file = (req as any).file as Buffer | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  let rows;
  try {
    rows = await parseImportFile(file, (req as any).file?.originalname || "upload.csv");
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Failed to parse file" });
  }

  const result: ImportResult = { imported: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const dateStr = String(row.date || "").trim();
    const type = String(row.type || "").trim().toUpperCase();
    const amount = Number(row.amountInKobo || row.amount || 0);
    const description = String(row.description || "").trim();
    const fundCode = String(row.fundCode || row.fund || "").trim();
    const memberName = row.memberName ? String(row.memberName).trim() : undefined;

    if (!dateStr || !type || isNaN(amount) || !description) {
      fail(result, rowNum, "date, type, amountInKobo, and description are required");
      continue;
    }

    if (!["DONATION", "EXPENSE", "TRANSFER"].includes(type)) {
      fail(result, rowNum, `Invalid type: ${type}. Must be DONATION, EXPENSE, or TRANSFER`);
      continue;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      fail(result, rowNum, `Invalid date: ${dateStr}`);
      continue;
    }

    let fundId: string | undefined;
    if (fundCode) {
      const fund = await prisma.fund.findFirst({
        where: { organizationId: user!.organizationId, name: { contains: fundCode, mode: "insensitive" } },
        select: { id: true },
      });
      fundId = fund?.id;
    }

    try {
      await prisma.ledgerEntry.create({
        data: {
          organizationId: user!.organizationId,
          fundId: fundId ?? "",
          type: type as any,
          amountInKobo: BigInt(Math.round(amount)),
          description: `${memberName ? `${memberName} — ` : ""}${description}`,
          recordedById: user!.id,
          createdAt: date,
        },
      });
      result.imported++;
    } catch (err) {
      fail(result, rowNum, err instanceof Error ? err.message : "Failed to create ledger entry");
    }
  }

  return res.status(200).json(result);
};

export const importChartOfAccounts = async (req: TenantRequest, res: Response) => {
  const user = req.user;
  const file = (req as any).file as Buffer | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  let rows;
  try {
    rows = await parseImportFile(file, (req as any).file?.originalname || "upload.csv");
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Failed to parse file" });
  }

  const result: ImportResult = { imported: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const code = String(row.code || "").trim();
    const name = String(row.name || "").trim();
    const type = String(row.type || "").trim().toUpperCase();

    if (!code || !name || !type) {
      fail(result, rowNum, "code, name, and type are required");
      continue;
    }

    if (!["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].includes(type)) {
      fail(result, rowNum, `Invalid type: ${type}. Must be ASSET, LIABILITY, EQUITY, INCOME, or EXPENSE`);
      continue;
    }

    try {
      await prisma.chartOfAccounts.upsert({
        where: { code_organizationId: { code, organizationId: user!.organizationId } },
        update: { name, type: type as any },
        create: { code, name, type: type as any, organizationId: user!.organizationId },
      });
      result.imported++;
    } catch (err) {
      fail(result, rowNum, err instanceof Error ? err.message : "Failed to create/update account");
    }
  }

  return res.status(200).json(result);
};

export const importController = {
  importMembers,
  importLedgerEntries,
  importChartOfAccounts,
};
