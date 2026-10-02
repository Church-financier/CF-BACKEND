import { describe, it, expect, vi } from "vitest";
import { fiscalYearOf, fiscalMonthOf, fiscalYearStart, fiscalYearRange } from "../src/utils/fiscalYear";
import { isValidTimeZone, isValidCurrencyCode } from "../src/utils/date";
import { settingsCache } from "../src/lib/settingsCache";
import { sessionActivity } from "../src/services/sessionActivity";
import { systemSettingsUpdateSchema } from "../src/schemas";

describe("fiscal year calculations", () => {
  it("computes calendar-aligned fiscal year when start month is January", () => {
    const d = new Date(2026, 9, 15); // Oct 15 2026
    expect(fiscalYearOf(d, 1)).toBe(2026);
    expect(fiscalMonthOf(d, 1)).toBe(10);
  });

  it("rolls the fiscal year back for months before the start month", () => {
    const d = new Date(2026, 0, 15); // Jan 15 2026
    expect(fiscalYearOf(d, 4)).toBe(2025); // Apr-start FY started Apr 2025
    expect(fiscalMonthOf(d, 4)).toBe(10); // Jan is 10th month of FY
  });

  it("computes fiscal year start boundary aligned to start month", () => {
    const d = new Date(2026, 9, 15); // Oct 2026
    expect(fiscalYearStart(d, 4)).toEqual(new Date(2026, 3, 1)); // Apr 1 2026
  });

  it("computes range spanning a full fiscal year", () => {
    const d = new Date(2026, 0, 15); // Jan 15 2026
    const r = fiscalYearRange(d, 4);
    expect(r.fiscalYear).toBe(2025);
    expect(r.start).toEqual(new Date(2025, 3, 1));
    expect(r.end.getTime()).toBe(new Date(2026, 3, 1, 0, 0, 0, -1).getTime());
  });

  it("treats month equal to start month as the first fiscal month", () => {
    const d = new Date(2026, 3, 10); // Apr 10 2026
    expect(fiscalYearOf(d, 4)).toBe(2026);
    expect(fiscalMonthOf(d, 4)).toBe(1);
  });
});

describe("timezone and currency validation", () => {
  it("accepts valid IANA timezones", () => {
    expect(isValidTimeZone("Africa/Lagos")).toBe(true);
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
  });

  it("rejects invalid timezones", () => {
    expect(isValidTimeZone("Not/A/Zone")).toBe(false);
    expect(isValidTimeZone("Europe/Berlin Extra")).toBe(false);
  });

  it("accepts valid ISO 4217 currency codes", () => {
    expect(isValidCurrencyCode("NGN")).toBe(true);
    expect(isValidCurrencyCode("USD")).toBe(true);
    expect(isValidCurrencyCode("GHS")).toBe(true);
  });

  it("rejects invalid currency codes", () => {
    expect(isValidCurrencyCode("NG")).toBe(false);
    expect(isValidCurrencyCode("NGN1")).toBe(false);
    expect(isValidCurrencyCode("XYZ")).toBe(false);
  });
});

describe("settings cache", () => {
  const sample = {
    id: "org-1",
    name: "Test Org",
    currency: "NGN",
    fiscalYearStartMonth: 1,
    timezone: "Africa/Lagos",
    requireMfa: false,
    sessionTimeoutMinutes: 480,
    createdAt: new Date(),
  };

  it("stores and returns cached values", () => {
    settingsCache.set("org-1", sample, 60000);
    expect(settingsCache.get("org-1")).toEqual(sample);
  });

  it("returns null after purge", () => {
    settingsCache.set("org-2", sample, 60000);
    settingsCache.purge("org-2");
    expect(settingsCache.get("org-2")).toBeNull();
  });

  it("expires entries after TTL", () => {
    settingsCache.set("org-3", sample, 1);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(settingsCache.get("org-3")).toBeNull();
        resolve();
      }, 10);
    });
  });
});

describe("session activity inactivity timer", () => {
  it("touch marks a session active and is not expired", () => {
    sessionActivity.touch("u1", 480);
    expect(sessionActivity.isTracked("u1")).toBe(true);
    expect(sessionActivity.isExpired("u1")).toBe(false);
  });

  it("reports expired when inactivity exceeds timeout", async () => {
    vi.useFakeTimers();
    try {
      sessionActivity.touch("u2", 1);
      expect(sessionActivity.isExpired("u2")).toBe(false);
      vi.advanceTimersByTime(61 * 1000);
      expect(sessionActivity.isExpired("u2")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("revoke removes the session", () => {
    sessionActivity.touch("u3", 480);
    sessionActivity.revoke("u3");
    expect(sessionActivity.isTracked("u3")).toBe(false);
  });
});

describe("system settings schema validation", () => {
  const base = {
    organizationName: "Kingdom School's Organization",
    baseCurrency: "NGN",
    fiscalYearStartMonth: 1,
    timezone: "Africa/Lagos",
    requireMfa: false,
    sessionTimeoutMinutes: 480,
  };

  it("accepts valid settings", () => {
    expect(systemSettingsUpdateSchema.parse(base)).toEqual(base);
  });

  it("accepts partial updates", () => {
    expect(systemSettingsUpdateSchema.parse({ baseCurrency: "USD" })).toEqual({ baseCurrency: "USD" });
  });

  it("rejects invalid currency code", () => {
    expect(() => systemSettingsUpdateSchema.parse({ baseCurrency: "NGN1" })).toThrow();
  });

  it("rejects unknown currency code", () => {
    expect(() => systemSettingsUpdateSchema.parse({ baseCurrency: "XYZ" })).toThrow();
  });

  it("rejects invalid timezone", () => {
    expect(() => systemSettingsUpdateSchema.parse({ timezone: "Bogus/Zone" })).toThrow();
  });

  it("rejects fiscal year start month out of range", () => {
    expect(() => systemSettingsUpdateSchema.parse({ fiscalYearStartMonth: 13 })).toThrow();
    expect(() => systemSettingsUpdateSchema.parse({ fiscalYearStartMonth: 0 })).toThrow();
  });

  it("rejects session timeout out of bounds", () => {
    expect(() => systemSettingsUpdateSchema.parse({ sessionTimeoutMinutes: 10 })).toThrow();
    expect(() => systemSettingsUpdateSchema.parse({ sessionTimeoutMinutes: 5000 })).toThrow();
  });

  it("rejects non-boolean requireMfa", () => {
    expect(() => systemSettingsUpdateSchema.parse({ requireMfa: "yes" })).toThrow();
  });
});
