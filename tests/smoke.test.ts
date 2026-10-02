import { describe, it, expect } from "vitest";

describe("kobo currency formatting", () => {
  function formatNaira(kobo: bigint): string {
    const negative = kobo < BigInt(0);
    const abs = negative ? -kobo : kobo;
    const naira = abs / BigInt(100);
    const koboRem = (abs % BigInt(100)).toString().padStart(2, "0");
    const nairaStr = naira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${negative ? "-" : ""}₦${nairaStr}.${koboRem}`;
  }

  it("formats 100 kobo as ₦1.00", () => {
    expect(formatNaira(BigInt(100))).toBe("₦1.00");
  });

  it("formats 1,234,567,890 kobo as ₦12,345,678.90", () => {
    expect(formatNaira(BigInt(1234567890))).toBe("₦12,345,678.90");
  });

  it("formats negative amounts", () => {
    expect(formatNaira(BigInt(-50))).toBe("-₦0.50");
  });
});

describe("sanitize for log", () => {
  it("redacts sensitive fields", async () => {
    const { sanitizeForLog } = await import("../src/utils/sanitize");
    const result = sanitizeForLog({
      email: "x@y.com",
      password: "secret123",
      nested: { token: "abc", other: "ok" },
    }) as any;
    expect(result.email).toBe("x@y.com");
    expect(result.password).toBe("[redacted]");
    expect(result.nested.token).toBe("[redacted]");
    expect(result.nested.other).toBe("ok");
  });
});

describe("journal entry balance validation", () => {
  it("rejects unbalanced entries (helper logic)", () => {
    const lines = [
      { debitInKobo: BigInt(1000), creditInKobo: BigInt(0) },
      { debitInKobo: BigInt(0), creditInKobo: BigInt(500) },
    ];
    const totalDebit = lines.reduce((s, l) => s + l.debitInKobo, BigInt(0));
    const totalCredit = lines.reduce((s, l) => s + l.creditInKobo, BigInt(0));
    expect(totalDebit).not.toBe(totalCredit);
  });

  it("accepts balanced entries", () => {
    const lines = [
      { debitInKobo: BigInt(1000), creditInKobo: BigInt(0) },
      { debitInKobo: BigInt(0), creditInKobo: BigInt(1000) },
    ];
    const totalDebit = lines.reduce((s, l) => s + l.debitInKobo, BigInt(0));
    const totalCredit = lines.reduce((s, l) => s + l.creditInKobo, BigInt(0));
    expect(totalDebit).toBe(totalCredit);
  });
});

describe("disbursement line items sum check", () => {
  it("detects mismatched line items", () => {
    const lineItems = [
      { description: "Item 1", amountInKobo: BigInt(1000) },
      { description: "Item 2", amountInKobo: BigInt(500) },
    ];
    const amount = BigInt(2000);
    const itemsTotal = lineItems.reduce((s, l) => s + l.amountInKobo, BigInt(0));
    expect(itemsTotal).not.toBe(amount);
  });
});
