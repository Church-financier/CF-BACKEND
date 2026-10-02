import { Writable } from "stream";
import { DOC_MARGIN, DOC_CONTENT_WIDTH } from "./documentComponents";
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
/**
 * Spell a minor-unit amount in words, e.g.
 * "One Million, Two Hundred Thousand Naira, Fifty Kobo Only".
 */
export declare function amountInWords(amountInKobo: bigint, currency?: string | null): string;
/**
 * The fingerprint printed on a voucher, shared by the PDF renderer and the
 * JSON endpoint that drives the HTML print template.
 */
export declare function computeVoucherHash(input: {
    organizationName: string;
    voucherNumber: string;
    amountInKobo: bigint;
    currency: string;
    paidAt: Date;
    payeeName: string;
}): string;
/**
 * Render a payment voucher as a one-page A4 PDF, sharing the e-Receipt's
 * design language: branded header, metadata bar, amount banner, line-item
 * table, authorization trail and a verification footer.
 */
export declare function generatePaymentVoucherPdf(target: PaymentVoucherTarget, data: PaymentVoucherData, organizationId?: string): Promise<Buffer>;
export { DOC_CONTENT_WIDTH, DOC_MARGIN };
//# sourceMappingURL=paymentVoucherService.d.ts.map