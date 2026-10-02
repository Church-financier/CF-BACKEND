import { Writable } from "stream";
import {
  DOC_COLORS,
  DOC_MARGIN,
  DOC_CONTENT_WIDTH,
  FONT_BOLD,
  FONT_REGULAR,
  createDocument,
  deliverDocument,
  drawAuditFooter,
  drawDefinitionList,
  drawDocumentHeader,
  drawMetadataBar,
  drawTable,
  drawTotalBanner,
  money,
  verificationHash,
  verificationPayload,
  type TableColumn,
  type TableRow,
} from "./documentComponents";
import { formatDateOnly, formatTimestamp, resolveTimezone } from "./pdfReportRenderer";
import { getOrgBranding, type OrgBranding } from "./orgBrandingService";
import { formatMinorUnits, getMinorUnitDigits, normalizeCurrencyCode } from "../utils/documentCurrency";

export interface PaymentVoucherTarget extends Writable {
  setHeader?(name: string, value: string): void;
}

export interface PaymentVoucherLineItem {
  description: string;
  amountInKobo: bigint;
}

export interface PaymentVoucherData {
  voucherNumber: string;
  organizationName: string;
  organizationAddress?: string | null;
  organizationPhone?: string | null;
  organizationEmail?: string | null;
  organizationLogoUrl?: string | null;
  paidAt: Date;
  purpose: string;
  payeeName: string;
  payeeBankDetails: string[];
  amountInKobo: bigint;
  amountInWords: string;
  paymentMethod: string;
  paymentReference: string | null;
  paymentNotes: string | null;
  requestedBy: string;
  firstApprovedBy: string | null;
  secondApprovedBy: string | null;
  paidBy: string;
  lineItems: PaymentVoucherLineItem[];
  currency?: string;
  timezone?: string;
  /** SHA-256 verification digest printed on the document. */
  verificationHash?: string;
}

async function resolveBranding(data: PaymentVoucherData, organizationId?: string): Promise<OrgBranding> {
  if (organizationId) {
    const branding = await getOrgBranding(organizationId);
    if (branding.id) return branding;
  }
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

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function chunkToWords(chunk: number): string {
  const parts: string[] = [];
  if (chunk >= 100) {
    parts.push(`${ONES[Math.floor(chunk / 100)]} Hundred`);
    chunk %= 100;
  }
  if (chunk >= 20) {
    parts.push(TENS[Math.floor(chunk / 10)]);
    chunk %= 10;
  }
  if (chunk > 0) parts.push(ONES[chunk]);
  return parts.join(" ");
}

/**
 * Currency names used when spelling an amount out.
 * The major unit is the currency name; the minor unit is its subdivision
 * ("Naira" / "Kobo", "CFA Franc" / "Centime", "Dollar" / "Cent").
 */
const MINOR_UNIT_NAMES: Record<string, { major: string; minor: string }> = {
  NGN: { major: "Naira", minor: "Kobo" },
  USD: { major: "Dollar", minor: "Cent" },
  EUR: { major: "Euro", minor: "Cent" },
  GBP: { major: "Pound", minor: "Penny" },
  GHS: { major: "Cedi", minor: "Pesewa" },
  ZAR: { major: "Rand", minor: "Cent" },
  KES: { major: "Shilling", minor: "Cent" },
  EGP: { major: "Pound", minor: "Piastre" },
  ZMW: { major: "Kwacha", minor: "Ngwee" },
  TZS: { major: "Shilling", minor: "Cent" },
  UGX: { major: "Shilling", minor: "Cent" },
  RWF: { major: "Franc", minor: "Centime" },
  XOF: { major: "CFA Franc", minor: "Centime" },
  XAF: { major: "CFA Franc", minor: "Centime" },
  ETB: { major: "Birr", minor: "Santim" },
  CAD: { major: "Dollar", minor: "Cent" },
  AUD: { major: "Dollar", minor: "Cent" },
  INR: { major: "Rupee", minor: "Paisa" },
  JPY: { major: "Yen", minor: "Sen" },
  CNY: { major: "Yuan", minor: "Fen" },
  BRL: { major: "Real", minor: "Centavo" },
};

/** Default wording for any currency without an explicit entry above. */
const DEFAULT_UNIT_NAMES = { major: "Unit", minor: "Cent" };

/**
 * Spell a minor-unit amount in words, e.g.
 * "One Million, Two Hundred Thousand Naira, Fifty Kobo Only".
 */
export function amountInWords(amountInKobo: bigint, currency?: string | null): string {
  const code = normalizeCurrencyCode(currency);
  const names = MINOR_UNIT_NAMES[code] ?? DEFAULT_UNIT_NAMES;
  const digits = getMinorUnitDigits(code);
  const divisor = BigInt(10 ** digits);
  const negative = amountInKobo < BigInt(0);
  const abs = negative ? -amountInKobo : amountInKobo;
  const major = Number(abs / divisor);
  const minorPart = digits > 0 ? Number(abs % divisor) : 0;

  if (major === 0 && minorPart === 0) return `Zero ${names.major} Only`;

  const groups: Array<[number, string]> = [
    [1_000_000_000, "Billion"],
    [1_000_000, "Million"],
    [1_000, "Thousand"],
  ];

  const majorWords: string[] = [];
  let remaining = major;
  for (const [value, label] of groups) {
    const count = Math.floor(remaining / value);
    if (count > 0) {
      majorWords.push(`${chunkToWords(count)} ${label}`);
      remaining %= value;
    }
  }
  if (remaining > 0) majorWords.push(chunkToWords(remaining));

  const minorWords = minorPart > 0 ? `${chunkToWords(minorPart)} ${names.minor}` : "";
  const majorPhrase = `${majorWords.join(" ")} ${names.major}`.trim();

  let body: string;
  if (majorWords.length > 0 && minorWords) body = `${majorPhrase}, ${minorWords} Only`;
  else if (majorWords.length > 0) body = `${majorPhrase} Only`;
  else body = `${minorWords} Only`;

  return negative ? `Minus ${body}` : body;
}

/**
 * The fingerprint printed on a voucher, shared by the PDF renderer and the
 * JSON endpoint that drives the HTML print template.
 */
export function computeVoucherHash(input: {
  organizationName: string;
  voucherNumber: string;
  amountInKobo: bigint;
  currency: string;
  paidAt: Date;
  payeeName: string;
}): string {
  return verificationHash([
    input.organizationName,
    input.voucherNumber,
    formatMinorUnits(input.amountInKobo, input.currency),
    normalizeCurrencyCode(input.currency),
    input.paidAt.toISOString(),
    input.payeeName,
  ]);
}

const VOUCHER_COLUMNS: TableColumn[] = [
  { header: "Description", flex: 4 },
  { header: "Reference", flex: 1.6, align: "center" },
  { header: "Amount", flex: 2, align: "right" },
];

/**
 * Render a payment voucher as a one-page A4 PDF, sharing the e-Receipt's
 * design language: branded header, metadata bar, amount banner, line-item
 * table, authorization trail and a verification footer.
 */
export async function generatePaymentVoucherPdf(
  target: PaymentVoucherTarget,
  data: PaymentVoucherData,
  organizationId?: string
): Promise<Buffer> {
  const branding = await resolveBranding(data, organizationId);
  const currency = normalizeCurrencyCode(branding.currency);
  const timezone = resolveTimezone(branding.timezone);
  const paidAt = data.paidAt instanceof Date ? data.paidAt : new Date(data.paidAt);
  const timestamp = formatTimestamp(paidAt, timezone);
  const amountWords = data.amountInWords || amountInWords(data.amountInKobo, currency);

  const hash =
    data.verificationHash ??
    computeVoucherHash({
      organizationName: branding.name,
      voucherNumber: data.voucherNumber,
      amountInKobo: data.amountInKobo,
      currency,
      paidAt,
      payeeName: data.payeeName,
    });

  const doc = createDocument(data.voucherNumber, branding, "Official Payment Voucher");

  target.setHeader?.("Content-Type", "application/pdf");
  target.setHeader?.(
    "Content-Disposition",
    `inline; filename="payment-voucher-${data.voucherNumber.replace(/[^A-Za-z0-9-_]/g, "")}.pdf"`
  );

  let y = await drawDocumentHeader(doc, branding, {
    title: "Payment Voucher",
    reference: data.voucherNumber,
  });
  y += 16;

  drawMetadataBar(
    doc,
    [
      { label: "Voucher No", value: data.voucherNumber },
      { label: "Payment Date", value: formatDateOnly(paidAt, timezone) },
      { label: "Payment Method", value: (data.paymentMethod || "Not recorded").toUpperCase() },
      { label: "Status", value: "PAID", tone: "success" },
    ],
    { y }
  );
  y += 46 + 16;

  y = drawTotalBanner(doc, {
    y,
    label: "Amount Paid",
    amount: money(data.amountInKobo, currency),
    note: amountWords,
  });
  y += 18;

  // Payee and payment details.
  doc
    .font(FONT_BOLD)
    .fontSize(7)
    .fillColor(DOC_COLORS.muted)
    .text("PAYEE & PAYMENT DETAILS", DOC_MARGIN, y, { width: DOC_CONTENT_WIDTH });
  y += 13;
  y = drawDefinitionList(
    doc,
    [
      { label: "Payee", value: data.payeeName, emphasis: true },
      ...data.payeeBankDetails.map((detail) => ({ label: "Payment Details", value: detail })),
      { label: "Purpose", value: data.purpose },
      { label: "Payment Reference", value: data.paymentReference || "—" },
      { label: "Notes", value: data.paymentNotes || "—" },
    ],
    { y, stripe: true }
  );
  y += 16;

  // Line items.
  const rows: TableRow[] = data.lineItems.map((item, index) => ({
    cells: [item.description, String(index + 1).padStart(2, "0"), money(item.amountInKobo, currency)],
  }));
  rows.push({ kind: "total", cells: ["TOTAL", "", money(data.amountInKobo, currency)] });

  doc
    .font(FONT_BOLD)
    .fontSize(7)
    .fillColor(DOC_COLORS.muted)
    .text("LINE ITEMS", DOC_MARGIN, y, { width: DOC_CONTENT_WIDTH });
  y += 13;
  y = drawTable(doc, VOUCHER_COLUMNS, rows, {
    y,
    emptyMessage: "No line items were recorded; this voucher covers the full amount above.",
  });
  y += 18;

  // Authorization trail.
  doc
    .font(FONT_BOLD)
    .fontSize(7)
    .fillColor(DOC_COLORS.muted)
    .text("AUTHORIZATION TRAIL", DOC_MARGIN, y, { width: DOC_CONTENT_WIDTH });
  y += 13;
  y = drawDefinitionList(
    doc,
    [
      { label: "Requested By", value: data.requestedBy },
      { label: "First Approval", value: data.firstApprovedBy || "—" },
      { label: "Second Approval", value: data.secondApprovedBy || "—" },
      { label: "Paid By", value: data.paidBy, emphasis: true },
      { label: "Amount In Words", value: amountWords },
    ],
    { y, stripe: true }
  );

  await drawAuditFooter(doc, {
    y: y + 26,
    signatures: [
      { role: "Treasurer / Authorized Signatory", hint: "Releasing officer", name: data.paidBy },
      { role: "Received By / Payee", hint: "Signature and date", name: data.payeeName },
    ],
    qrText: verificationPayload({
      reference: data.voucherNumber,
      amount: data.amountInKobo,
      currency,
      date: paidAt,
      hash,
    }),
    hash,
    printedAt: new Date(),
    timezone,
    note: `Retain for audit and reconciliation. Verification hash ${hash.slice(0, 16)}…`,
  });

  return deliverDocument(doc, target);
}

export { DOC_CONTENT_WIDTH, DOC_MARGIN };
