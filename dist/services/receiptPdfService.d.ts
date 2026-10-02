import { Writable } from "stream";
import { statusColorFor } from "./documentComponents";
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
export declare function computeReceiptHash(input: {
    organizationName: string;
    receiptNumber: string;
    receiptId: string;
    amount: bigint | number | string;
    currency: string;
    date: Date;
    status: string;
}): string;
/**
 * Build a human-facing receipt number of the form REC-2026-0042.
 *
 * The sequence is derived from the last digits of the entry id so it is
 * stable, collision-free across organizations, and does not require a
 * per-organization counter table.
 */
export declare function formatReceiptNumber(entryId: string, date: Date, timezone: string): string;
/**
 * Render an enterprise-style e-Receipt as a one-page A4 PDF.
 *
 * Layout: branded header, metadata bar with a status badge, prominent total
 * banner, itemised transaction table, details grid, and a signature/audit
 * footer carrying a verification QR code and hash.
 */
export declare function generateReceiptPdf(target: ReceiptTarget, data: ReceiptData, organizationId?: string): Promise<Buffer>;
/**
 * Build the receipt payload for a contribution, including the verification
 * hash. The same payload feeds the PDF renderer and the JSON endpoint that
 * drives the HTML print template, so both documents show the same hash.
 */
export declare function buildReceiptForContribution(organizationId: string, entryId: string): Promise<ReceiptData>;
export { statusColorFor };
//# sourceMappingURL=receiptPdfService.d.ts.map