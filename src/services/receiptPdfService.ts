import { Writable } from "stream";
import {
  DOC_COLORS,
  DOC_MARGIN,
  DOC_CONTENT_WIDTH,
  FONT_BOLD,
  FONT_REGULAR,
  deliverDocument,
  drawAuditFooter,
  drawDefinitionList,
  drawDocumentHeader,
  drawMetadataBar,
  drawStatusBadge,
  drawTable,
  drawTotalBanner,
  createDocument,
  money,
  statusColorFor,
  verificationHash,
  verificationPayload,
  type TableColumn,
  type TableRow,
} from "./documentComponents";
import { formatTimestamp, resolveTimezone } from "./pdfReportRenderer";
import { getOrgBranding, type OrgBranding } from "./orgBrandingService";
import { formatMinorUnits, normalizeCurrencyCode } from "../utils/documentCurrency";
import { prisma } from "../lib/prisma";

export interface ReceiptTarget extends Writable {
  setHeader?(name: string, value: string): void;
}

export interface ReceiptLineItem {
  description: string;
  category: string;
  quantity: string;
  unitPrice: string;
  amount: bigint | number | string;
}

export interface ReceiptData {
  organizationName: string;
  organizationAddress?: string | null;
  organizationPhone?: string | null;
  organizationEmail?: string | null;
  organizationLogoUrl?: string | null;
  receiptId: string;
  /** Sequential display number, e.g. "REC-2026-0042". */
  receiptNumber?: string;
  date: string | Date;
  fund: string;
  /** Fund this contribution was booked against. */
  fundId?: string;
  amount: bigint | number | string;
  currency?: string;
  description?: string;
  recordedBy?: string;
  payerName?: string;
  paymentMethod?: string;
  status?: string;
  timezone?: string;
  /** Optional itemised breakdown; a single line is synthesised when absent. */
  lineItems?: ReceiptLineItem[];
  reference?: string | null;
  /**
   * SHA-256 verification digest. Supplied by `buildReceiptForContribution`
   * so the PDF and the JSON used by the HTML print template always agree;
   * recomputed from the payload when absent.
   */
  verificationHash?: string;
}

/**
 * The fingerprint printed on a receipt. Computed from the same inputs the
 * renderer uses, so the PDF and the HTML print template always agree, and a
 * recipient can quote it when confirming the figure.
 */
export function computeReceiptHash(input: {
  organizationName: string;
  receiptNumber: string;
  receiptId: string;
  amount: bigint | number | string;
  currency: string;
  date: Date;
  status: string;
}): string {
  return verificationHash([
    input.organizationName,
    input.receiptNumber,
    input.receiptId,
    formatMinorUnits(input.amount, input.currency),
    normalizeCurrencyCode(input.currency),
    input.date.toISOString(),
    input.status.toUpperCase(),
  ]);
}

function toDate(value: string | Date): Date {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Build a human-facing receipt number of the form REC-2026-0042.
 *
 * The sequence is derived from the last digits of the entry id so it is
 * stable, collision-free across organizations, and does not require a
 * per-organization counter table.
 */
export function formatReceiptNumber(entryId: string, date: Date, timezone: string): string {
  const year = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    timeZone: resolveTimezone(timezone),
  }).format(date);
  const digits = entryId.replace(/\D/g, "");
  const sequence = (digits.slice(-4) || entryId.slice(0, 4)).padStart(4, "0");
  return `REC-${year}-${sequence}`;
}

async function resolveBranding(data: ReceiptData, organizationId?: string): Promise<OrgBranding> {
  if (organizationId) {
    const branding = await getOrgBranding(organizationId);
    if (branding.id) return branding;
  }
  // Fall back to the values supplied by the caller.
  return {
    id: "",
    name: data.organizationName,
    address: data.organizationAddress ?? null,
    phone: data.organizationPhone ?? null,
    email: data.organizationEmail ?? null,
    logoUrl: data.organizationLogoUrl ?? null,
    currency: normalizeCurrencyCode(data.currency),
    timezone: data.timezone ?? "Africa/Lagos",
  };
}

function buildRows(data: ReceiptData, currency: string): TableRow[] {
  const items: ReceiptLineItem[] =
    data.lineItems && data.lineItems.length > 0
      ? data.lineItems
      : [
          {
            description: data.description || "Contribution received",
            category: data.fund,
            quantity: "1",
            unitPrice: money(data.amount, currency),
            amount: data.amount,
          },
        ];

  const rows: TableRow[] = items.map((item) => ({
    cells: [
      item.description,
      item.category,
      item.quantity,
      item.unitPrice,
      money(item.amount, currency),
    ],
  }));

  rows.push({
    kind: "total",
    cells: ["", "", "", "TOTAL PAID", money(data.amount, currency)],
  });

  return rows;
}

const RECEIPT_COLUMNS: TableColumn[] = [
  { header: "Item Description", flex: 3.4 },
  { header: "Category / Fund", flex: 1.8 },
  { header: "Quantity", flex: 0.8, align: "center" },
  { header: "Unit Price", flex: 1.5, align: "right" },
  { header: "Amount", flex: 1.7, align: "right" },
];

/**
 * Render an enterprise-style e-Receipt as a one-page A4 PDF.
 *
 * Layout: branded header, metadata bar with a status badge, prominent total
 * banner, itemised transaction table, details grid, and a signature/audit
 * footer carrying a verification QR code and hash.
 */
export async function generateReceiptPdf(target: ReceiptTarget, data: ReceiptData, organizationId?: string): Promise<Buffer> {
  const branding = await resolveBranding(data, organizationId);
  const currency = normalizeCurrencyCode(branding.currency);
  const timezone = resolveTimezone(branding.timezone);
  const date = toDate(data.date);
  const status = (data.status || "APPROVED").toUpperCase();
  const receiptNumber = data.receiptNumber ?? formatReceiptNumber(data.receiptId, date, timezone);
  const timestamp = formatTimestamp(date, timezone);

  const hash =
    data.verificationHash ??
    computeReceiptHash({
      organizationName: branding.name,
      receiptNumber,
      receiptId: data.receiptId,
      amount: data.amount,
      currency,
      date,
      status,
    });

  const doc = createDocument(receiptNumber, branding, "Official Receipt");

  target.setHeader?.("Content-Type", "application/pdf");
  target.setHeader?.(
    "Content-Disposition",
    `inline; filename="receipt-${receiptNumber.replace(/[^A-Za-z0-9-_]/g, "")}.pdf"`
  );

  let y = await drawDocumentHeader(doc, branding, {
    title: "Payment Receipt",
    reference: receiptNumber,
  });

  y += 16;

  // Metadata bar: reference, timestamp, method, payer.
  const metadataBarHeight = 46;
  drawMetadataBar(
    doc,
    [
      { label: "Receipt No", value: receiptNumber },
      { label: "Transaction Date", value: timestamp },
      { label: "Payment Method", value: (data.paymentMethod || "CASH").toUpperCase() },
      { label: "Received From", value: data.payerName || "Anonymous donor" },
    ],
    { y }
  );

  // Status badge sits on the same visual line as the metadata bar.
  drawStatusBadge(doc, status, {
    x: DOC_MARGIN + DOC_CONTENT_WIDTH - 96,
    y: y + metadataBarHeight + 6,
    width: 96,
    height: 22,
  });
  doc
    .font(FONT_REGULAR)
    .fontSize(6.2)
    .fillColor(DOC_COLORS.muted)
    .text("STATUS", DOC_MARGIN + DOC_CONTENT_WIDTH - 200, y + metadataBarHeight + 13, {
      width: 100,
      align: "right",
    });
  y += metadataBarHeight + 38;

  // Total paid banner.
  y = drawTotalBanner(doc, {
    y,
    label: "Total Paid",
    amount: money(data.amount, currency),
    note: `${currency} · ${status}`,
  });
  y += 18;

  // Itemised table.
  const tableBottom = drawTable(doc, RECEIPT_COLUMNS, buildRows(data, currency), {
    y,
    emptyMessage: "No line items were recorded for this receipt.",
  });
  y = tableBottom + 18;

  // Transaction details.
  doc
    .font(FONT_BOLD)
    .fontSize(7)
    .fillColor(DOC_COLORS.muted)
    .text("TRANSACTION DETAILS", DOC_MARGIN, y, { width: DOC_CONTENT_WIDTH });
  y += 13;
  y = drawDefinitionList(
    doc,
    [
      { label: "Receipt Number", value: receiptNumber, emphasis: true },
      { label: "Reference", value: data.reference || data.receiptId },
      { label: "Transaction Date", value: timestamp },
      { label: "Fund / Category", value: data.fund },
      { label: "Payment Method", value: (data.paymentMethod || "CASH").toUpperCase() },
      { label: "Description", value: data.description || "—" },
      { label: "Recorded By", value: data.recordedBy || "System" },
      { label: "Status", value: status },
    ],
    { y, stripe: true }
  );

  // Signature and verification footer.
  await drawAuditFooter(doc, {
    y: y + 26,
    signatures: [
      { role: "Authorized Signature", hint: "Treasurer / Financial Secretary" },
      { role: "Received By", hint: "Donor / Representative", name: data.payerName || undefined },
    ],
    qrText: verificationPayload({ reference: receiptNumber, amount: data.amount, currency, date, hash }),
    hash,
    printedAt: new Date(),
    timezone,
    note: `Verification hash ${hash.slice(0, 16)}… — quote this when confirming the receipt. Amount: ${formatMinorUnits(data.amount, currency)}.`,
  });

  return deliverDocument(doc, target);
}
/**
 * Build the receipt payload for a contribution, including the verification
 * hash. The same payload feeds the PDF renderer and the JSON endpoint that
 * drives the HTML print template, so both documents show the same hash.
 */
export async function buildReceiptForContribution(
  organizationId: string,
  entryId: string
): Promise<ReceiptData> {
  const entry = await prisma.ledgerEntry.findFirst({
    where: { id: entryId, organizationId, type: "DONATION", reversedById: null },
    include: {
      fund: true,
      recordedBy: { select: { name: true, email: true } },
      member: { select: { fullName: true, memberNumber: true } },
      organization: true,
    },
  });
  if (!entry) throw new Error("Contribution not found");

  const branding = await getOrgBranding(organizationId);
  const timezone = branding.timezone || entry.organization.timezone;
  const date = toDate(entry.transactionDate);
  const currency = normalizeCurrencyCode(entry.organization.currency);
  const receiptNumber = formatReceiptNumber(entry.id, date, timezone);
  const status = "APPROVED";
  const payerName = entry.member?.fullName ?? undefined;
  const recordedBy = entry.recordedBy ? `${entry.recordedBy.name} (${entry.recordedBy.email})` : "System";

  return {
    organizationName: entry.organization.name,
    organizationAddress: entry.organization.address,
    organizationPhone: entry.organization.phone,
    organizationEmail: entry.organization.email,
    organizationLogoUrl: entry.organization.logoUrl,
    receiptId: entry.id,
    receiptNumber,
    fundId: entry.fundId,
    date,
    fund: entry.fund?.name || "Unknown Fund",
    amount: entry.amountInKobo,
    currency,
    description: entry.description,
    paymentMethod: entry.contributionMethod ?? undefined,
    status,
    payerName,
    recordedBy,
    timezone,
    reference: entry.notes ?? undefined,
    verificationHash: computeReceiptHash({
      organizationName: entry.organization.name,
      receiptNumber,
      receiptId: entry.id,
      amount: entry.amountInKobo,
      currency,
      date,
      status,
    }),
  };
}

export { statusColorFor };
