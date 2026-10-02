/**
 * Currency primitives for generated documents.
 *
 * Amounts are persisted as integers in the currency's minor unit (the schema
 * calls them `*InKobo`, but they are the smallest indivisible unit). Everything
 * here is driven by the organization's base currency so a receipt, report or
 * voucher rendered for a GHS organization never shows a naira symbol.
 */

export const DEFAULT_CURRENCY = "NGN";

/** Static symbol table used as a fallback when Intl cannot resolve one. */
const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "GH₵",
  ZAR: "R",
  KES: "KSh",
  EGP: "E£",
  ZMW: "ZK",
  TZS: "TSh",
  UGX: "USh",
  RWF: "FRw",
  XOF: "CFA",
  XAF: "FCFA",
  ETB: "Br",
  CAD: "CA$",
  AUD: "A$",
  NZD: "NZ$",
  INR: "₹",
  JPY: "¥",
  CNY: "CN¥",
  HKD: "HK$",
  SGD: "S$",
  AED: "د.إ",
  SAR: "﷼",
  BRL: "R$",
  MXN: "MX$",
  CHF: "CHF",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  UAH: "₴",
  RUB: "₽",
  KZT: "₸",
  PHP: "₱",
  PKR: "₨",
  BDT: "৳",
  LKR: "Rs",
  ILS: "₪",
  TRY: "₺",
  MAD: "DH",
  DZD: "DA",
  TND: "DT",
  LYD: "LD",
  SDG: "ج.س",
  AOA: "Kz",
  MZN: "MT",
  BWP: "P",
  NAD: "N$",
};

/**
 * Currencies whose minor unit is not 1/100 of the major unit. Mirrors the
 * frontend's table so a figure means the same thing in the app and on paper.
 */
const MINOR_UNIT_DIGITS: Record<string, number> = {
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0,
  PYG: 0, RWF: 0, UGX: 0, UYI: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
};

/** Coerce anything into a well-formed ISO 4217 code, falling back to NGN. */
export function normalizeCurrencyCode(code: string | null | undefined): string {
  if (typeof code !== "string") return DEFAULT_CURRENCY;
  const normalized = code.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : DEFAULT_CURRENCY;
}

/** Number of decimal places in the currency's minor unit (0, 2 or 3). */
export function getMinorUnitDigits(code: string | null | undefined): number {
  return MINOR_UNIT_DIGITS[normalizeCurrencyCode(code)] ?? 2;
}

/** Display symbol for a currency, e.g. "₦" for NGN. */
export function getCurrencySymbol(code: string | null | undefined): string {
  const normalized = normalizeCurrencyCode(code);
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalized,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    const symbol = parts.find((part) => part.type === "currency")?.value;
    if (symbol && symbol !== normalized) return symbol;
  } catch {
    // fall through to the static table
  }
  return SYMBOLS[normalized] ?? normalized;
}

/** Human-readable currency name, e.g. "Nigerian Naira". */
export function getCurrencyName(code: string | null | undefined): string {
  const normalized = normalizeCurrencyCode(code);
  try {
    const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(normalized);
    if (name) return name;
  } catch {
    // fall through
  }
  return normalized;
}

/**
 * Format a minor-unit amount as a currency string with thousands separators,
 * e.g. 150000 -> "₦1,500.00".
 */
export function formatMinorUnits(
  amountInMinor: bigint | number | string,
  currency: string | null | undefined
): string {
  const normalized = normalizeCurrencyCode(currency);
  const digits = getMinorUnitDigits(normalized);
  const minor = toBigInt(amountInMinor);
  const negative = minor < BigInt(0);
  const abs = negative ? -minor : minor;
  const divisor = BigInt(10 ** digits);
  const major = abs / divisor;
  const remainder = (abs % divisor).toString().padStart(digits, "0");
  const grouped = major.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fraction = digits > 0 ? `.${remainder}` : "";
  return `${negative ? "-" : ""}${getCurrencySymbol(normalized)}${grouped}${fraction}`;
}

/** Minor units -> major units as a plain number, for Excel and chart input. */
export function toMajorUnits(
  amountInMinor: bigint | number | string,
  currency: string | null | undefined
): number {
  const digits = getMinorUnitDigits(currency);
  return Number(toBigInt(amountInMinor)) / 10 ** digits;
}

/**
 * Excel number format string for a currency, e.g. `"₦"#,##0.00`.
 *
 * Quoting the symbol keeps it literal so Excel does not try to interpret it,
 * and the format makes the cell a genuine number that spreadsheets can sum,
 * sort and chart. The negative section renders credits in red parentheses,
 * which is the accounting convention used throughout the reports.
 */
export function excelCurrencyFormat(currency: string | null | undefined): string {
  const normalized = normalizeCurrencyCode(currency);
  const digits = getMinorUnitDigits(normalized);
  const symbol = getCurrencySymbol(normalized);
  // Excel format strings escape a literal quote by doubling it.
  const escaped = symbol.replace(/"/g, '""');
  const fraction = digits > 0 ? `.${"0".repeat(digits)}` : "";
  return `"${escaped}"#,##0${fraction};[Red]("${escaped}"#,##0${fraction})`;
}

/** Coerce a serialized BigInt/string/number into a bigint safely. */
export function toBigInt(value: bigint | number | string | null | undefined): bigint {
  if (typeof value === "bigint") return value;
  if (value === null || value === undefined || value === "") return BigInt(0);
  try {
    if (typeof value === "number") return BigInt(Math.round(value));
    return BigInt(String(value).trim());
  } catch {
    return BigInt(0);
  }
}
