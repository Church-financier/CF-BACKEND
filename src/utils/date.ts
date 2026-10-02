export const DEFAULT_TIMEZONE = "Africa/Lagos";

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function isValidCurrencyCode(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) return false;
  const supportedCurrencies = (Intl as any).supportedValuesOf;
  if (typeof supportedCurrencies === "function") {
    try {
      return supportedCurrencies("currency").includes(code.toUpperCase());
    } catch {
      return true;
    }
  }
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: code });
    return true;
  } catch {
    return false;
  }
}

export function formatInTimezone(
  date: Date | string | number,
  timezone: string = DEFAULT_TIMEZONE,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "number" ? new Date(date) : date instanceof Date ? date : new Date(date);
  const tz = isValidTimeZone(timezone) ? timezone : DEFAULT_TIMEZONE;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
    timeZone: tz,
  }).format(d);
}
