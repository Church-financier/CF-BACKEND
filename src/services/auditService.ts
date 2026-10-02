import { prisma } from "../lib/prisma";
import { DEFAULT_CURRENCY, formatMinorUnits, normalizeCurrencyCode } from "../utils/documentCurrency";

const RESOURCE_SINGULAR: Record<string, string> = {
  funds: "Fund",
  "chart-of-accounts": "Chart Of Account",
  pledges: "Pledge",
  contributions: "Contribution",
  vendors: "Vendor",
  disbursements: "Disbursement Request",
  users: "User",
  departments: "Department",
  budgets: "Budget",
  members: "Member",
  "ledger-entries": "Ledger Entry",
  "journal-entries": "Journal Entry",
  periods: "Period",
};

const toTitleCase = (str: string) =>
  str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const singularizeResource = (resource: string): string => {
  const lower = resource.toLowerCase();
  if (RESOURCE_SINGULAR[lower]) return RESOURCE_SINGULAR[lower];
  if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
  if (lower.endsWith("ses") || lower.endsWith("xes") || lower.endsWith("zes")) return lower.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return resource;
};

const describeHttpLog = (details: Record<string, unknown>, currency: string): string => {
  const path = typeof details.path === "string" ? details.path : "";
  const method = typeof details.method === "string" ? details.method : "";
  const body = (details.body && typeof details.body === "object") ? details.body as Record<string, unknown> : {};
  const segments = path.replace(/^\/api\//, "").split("/").filter(Boolean);
  const rawResource = segments[0] || "";
  const resource = singularizeResource(toTitleCase(rawResource));
  const actionWord = (() => {
    if (method === "POST") return "Created";
    if (method === "PATCH" || method === "PUT") {
      if (path.includes("approve")) return "Approved";
      if (path.includes("reject")) return "Rejected";
      if (path.includes("reverse")) return "Reversed";
      if (path.includes("cancel")) return "Cancelled";
      if (path.includes("mark-paid")) return "Marked as paid";
      if (path.includes("first-approve")) return "First approved";
      if (path.includes("second-approve")) return "Second approved";
      if (path.includes("role")) return "Updated role for";
      return "Updated";
    }
    if (method === "DELETE") return "Deleted";
    return "Accessed";
  })();

  if (path.includes("/batch") && Array.isArray(body.entries) && body.entries.length > 0) {
    const count = body.entries.length;
    const totalKobo = body.entries.reduce((sum: number, entry: Record<string, unknown>) => {
      const amount = typeof entry.amountInKobo === "number" ? entry.amountInKobo : 0;
      return sum + amount;
    }, 0);
    const total = formatMinorUnits(totalKobo, currency);
    return `Batch created ${count} ${resource.toLowerCase()}(s) totaling ${total}`;
  }

  const identifier =
    (typeof body.name === "string" && body.name) ||
    (typeof body.code === "string" && body.code) ||
    (typeof body.memberName === "string" && body.memberName) ||
    (typeof body.email === "string" && body.email) ||
    (typeof body.purpose === "string" && body.purpose) ||
    (typeof body.description === "string" && body.description) ||
    (segments.length > 1 ? segments[1] : "");

  if (identifier) return `${actionWord} ${resource}: ${identifier}`;
  return `${actionWord} ${resource}`;
};

const describeEntityLog = (action: string, details: Record<string, unknown>): string => {
  const entity = typeof details.entity === "string" ? singularizeResource(details.entity) : "Record";
  const actionText = (() => {
    if (action.includes("CREATE")) return "Created a new";
    if (action.includes("UPDATE")) return "Updated";
    if (action.includes("DELETE")) return "Deleted";
    if (action.includes("VOID")) return "Voided";
    return "Modified";
  })();
  return `${actionText} ${entity}`;
};

const describePeriodLog = (action: string, details: Record<string, unknown>): string => {
  const year = typeof details.fiscalYear === "number" ? details.fiscalYear : "?";
  const month = typeof details.month === "number" ? details.month : "?";
  const label = action.includes("LOCK") ? "Locked" : "Unlocked";
  return `${label} fiscal year ${year}, month ${month}`;
};

const generateDescription = (action: string, details: Record<string, unknown>, currency: string): string => {
  if (details.path && details.method) return describeHttpLog(details, currency);
  if (details.entity && details.entityId) return describeEntityLog(action, details);
  if (details.fiscalYear !== undefined && details.month !== undefined) return describePeriodLog(action, details);
  return action;
};

export const auditService = {
  async log(data: {
    userId: string;
    action: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    organizationId?: string;
  }) {
    let organizationId = data.organizationId;
    if (!organizationId) {
      try {
        const user = await prisma.user.findUnique({ where: { id: data.userId }, select: { organizationId: true } });
        if (user) organizationId = user.organizationId;
      } catch {
        // best-effort
      }
    }
    if (!organizationId) {
      console.warn(`auditService.log dropped: missing organizationId for user ${data.userId}`);
      return null;
    }
    let currency = DEFAULT_CURRENCY;
    try {
      // Read the org row directly rather than via systemSettingsService, which
      // itself logs through this service.
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { currency: true },
      });
      currency = normalizeCurrencyCode(org?.currency);
    } catch {
      // best-effort: an unreadable org row must not drop the audit entry
    }

    const description = generateDescription(data.action, data.details, currency);
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        details: { ...data.details, description } as any,
        ipAddress: data.ipAddress,
        organizationId,
      },
    });
  },

  async logCreation(entity: string, entityId: string, userId: string, ipAddress?: string) {
    return this.log({
      userId,
      action: "CREATE_" + entity.toUpperCase(),
      details: { entity, entityId },
      ipAddress,
    });
  },

  async logUpdate(entity: string, entityId: string, userId: string, ipAddress?: string) {
    return this.log({
      userId,
      action: `UPDATE_${entity.toUpperCase()}`,
      details: { entity, entityId },
      ipAddress,
    });
  },

  async logDelete(entity: string, entityId: string, userId: string, ipAddress?: string) {
    return this.log({
      userId,
      action: `DELETE_${entity.toUpperCase()}`,
      details: { entity, entityId },
      ipAddress,
    });
  },

  async logVoid(entity: string, entityId: string, userId: string, ipAddress?: string) {
    return this.log({
      userId,
      action: `VOID_${entity.toUpperCase()}`,
      details: { entity, entityId },
      ipAddress,
    });
  },

  async list(organizationId: string, filters: { userId?: string; action?: string; page?: number; pageSize?: number }) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const where: any = { organizationId };
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, pageSize };
  },
};
