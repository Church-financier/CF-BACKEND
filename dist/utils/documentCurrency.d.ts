/**
 * Currency primitives for generated documents.
 *
 * Amounts are persisted as integers in the currency's minor unit (the schema
 * calls them `*InKobo`, but they are the smallest indivisible unit). Everything
 * here is driven by the organization's base currency so a receipt, report or
 * voucher rendered for a GHS organization never shows a naira symbol.
 */
export declare const DEFAULT_CURRENCY = "NGN";
/** Coerce anything into a well-formed ISO 4217 code, falling back to NGN. */
export declare function normalizeCurrencyCode(code: string | null | undefined): string;
/** Number of decimal places in the currency's minor unit (0, 2 or 3). */
export declare function getMinorUnitDigits(code: string | null | undefined): number;
/** Display symbol for a currency, e.g. "₦" for NGN. */
export declare function getCurrencySymbol(code: string | null | undefined): string;
/** Human-readable currency name, e.g. "Nigerian Naira". */
export declare function getCurrencyName(code: string | null | undefined): string;
/**
 * Format a minor-unit amount as a currency string with thousands separators,
 * e.g. 150000 -> "₦1,500.00".
 */
export declare function formatMinorUnits(amountInMinor: bigint | number | string, currency: string | null | undefined): string;
/** Minor units -> major units as a plain number, for Excel and chart input. */
export declare function toMajorUnits(amountInMinor: bigint | number | string, currency: string | null | undefined): number;
/**
 * Excel number format string for a currency, e.g. `"₦"#,##0.00`.
 *
 * Quoting the symbol keeps it literal so Excel does not try to interpret it,
 * and the format makes the cell a genuine number that spreadsheets can sum,
 * sort and chart. The negative section renders credits in red parentheses,
 * which is the accounting convention used throughout the reports.
 */
export declare function excelCurrencyFormat(currency: string | null | undefined): string;
/** Coerce a serialized BigInt/string/number into a bigint safely. */
export declare function toBigInt(value: bigint | number | string | null | undefined): bigint;
//# sourceMappingURL=documentCurrency.d.ts.map