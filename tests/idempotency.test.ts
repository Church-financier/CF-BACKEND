import { describe, it, expect, vi, beforeEach } from "vitest";

// The service is exercised against a stand-in for the IdempotencyKey table so
// the replay semantics can be asserted without a live PostgreSQL instance.
const rows = new Map<string, any>();
const uniqueViolation = () => Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

const idempotencyKeyModel = {
  create: vi.fn(async ({ data }: any) => {
    const composite = `${data.organizationId}:${data.key}`;
    if (rows.has(composite)) throw uniqueViolation();
    const row = { id: `row-${rows.size + 1}`, ...data, responseStatus: null, responseBody: null };
    rows.set(composite, row);
    return row;
  }),
  findUnique: vi.fn(async ({ where }: any) => {
    const composite = `${where.organizationId_key.organizationId}:${where.organizationId_key.key}`;
    const row = rows.get(composite);
    return row ? { ...row } : null;
  }),
  updateMany: vi.fn(async ({ where, data }: any) => {
    const composite = `${where.organizationId}:${where.key}`;
    const row = rows.get(composite);
    if (!row || row.responseStatus !== null) return { count: 0 };
    Object.assign(row, data);
    return { count: 1 };
  }),
  deleteMany: vi.fn(async ({ where }: any) => {
    if (where.expiresAt) {
      const now = new Date();
      let count = 0;
      for (const [key, row] of rows) {
        if (row.expiresAt <= now) {
          rows.delete(key);
          count++;
        }
      }
      return { count };
    }
    const composite = `${where.organizationId}:${where.key}`;
    const row = rows.get(composite);
    if (!row || (where.responseStatus === null && row.responseStatus !== null)) return { count: 0 };
    rows.delete(composite);
    return { count: 1 };
  }),
  delete: vi.fn(async ({ where }: any) => {
    for (const [key, row] of rows) {
      if (row.id === where.id) {
        rows.delete(key);
        return row;
      }
    }
    throw new Error("not found");
  }),
};

vi.mock("../src/lib/prisma", () => ({
  prisma: { idempotencyKey: idempotencyKeyModel },
}));

const { idempotencyService, hashRequest, isValidIdempotencyKey } = await import(
  "../src/services/idempotencyService"
);

const KEY = "9f1c2b3a-4d5e-4f60-8a1b-2c3d4e5f6071";
const OTHER_KEY = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const RECORD = {
  key: KEY,
  userId: "user-1",
  organizationId: "org-1",
  endpoint: "POST /api/disbursements",
  requestHash: "hash-1",
};

beforeEach(() => {
  rows.clear();
  for (const fn of Object.values(idempotencyKeyModel)) fn.mockClear();
});

describe("idempotency key format", () => {
  it("accepts UUID v4 values", () => {
    expect(isValidIdempotencyKey(KEY)).toBe(true);
    expect(isValidIdempotencyKey(OTHER_KEY)).toBe(true);
  });

  it("rejects malformed keys", () => {
    expect(isValidIdempotencyKey("")).toBe(false);
    expect(isValidIdempotencyKey("not-a-uuid")).toBe(false);
    // A v1-shaped UUID is not a v4.
    expect(isValidIdempotencyKey("9f1c2b3a-4d5e-1f60-8a1b-2c3d4e5f6071")).toBe(false);
  });
});

describe("request fingerprinting", () => {
  it("is stable across key ordering", () => {
    const a = hashRequest({ method: "post", path: "/api/contributions", body: { x: 1, y: [1, 2] } });
    const b = hashRequest({ method: "POST", path: "/api/contributions", body: { y: [1, 2], x: 1 } });
    expect(a).toBe(b);
  });

  it("changes when the method, path or payload changes", () => {
    const base = hashRequest({ method: "POST", path: "/api/contributions", body: { amountInKobo: 500 } });
    expect(hashRequest({ method: "PATCH", path: "/api/contributions", body: { amountInKobo: 500 } })).not.toBe(base);
    expect(hashRequest({ method: "POST", path: "/api/disbursements", body: { amountInKobo: 500 } })).not.toBe(base);
    expect(hashRequest({ method: "POST", path: "/api/contributions", body: { amountInKobo: 501 } })).not.toBe(base);
  });
});

describe("idempotent claim lifecycle", () => {
  it("lets the first request proceed", async () => {
    const claim = await idempotencyService.claim(RECORD);
    expect(claim).toEqual({ outcome: "proceed" });
  });

  it("replays the stored response for a repeated key instead of executing again", async () => {
    await idempotencyService.claim(RECORD);
    await idempotencyService.complete("org-1", KEY, 201, { id: "disbursement-1" });

    const replay = await idempotencyService.claim(RECORD);
    expect(replay).toEqual({
      outcome: "replay",
      status: 201,
      body: { id: "disbursement-1" },
    });
  });

  it("reports an in-flight duplicate while the original is still running", async () => {
    await idempotencyService.claim(RECORD);
    const duplicate = await idempotencyService.claim(RECORD);
    expect(duplicate).toEqual({ outcome: "in_progress" });
  });

  it("detects a key reused with a different payload", async () => {
    await idempotencyService.claim(RECORD);
    await idempotencyService.complete("org-1", KEY, 200, { ok: true });

    const reused = await idempotencyService.claim({ ...RECORD, requestHash: "hash-2" });
    expect(reused).toEqual({ outcome: "key_reuse" });
  });

  it("reuses the key when a failed request released it", async () => {
    await idempotencyService.claim(RECORD);
    await idempotencyService.release("org-1", KEY);

    // A failed request is not cached: the client may retry the same key.
    const retry = await idempotencyService.claim(RECORD);
    expect(retry).toEqual({ outcome: "proceed" });
  });

  it("keeps a completed key when release is called, so the cache survives", async () => {
    await idempotencyService.claim(RECORD);
    await idempotencyService.complete("org-1", KEY, 200, { ok: true });
    await idempotencyService.release("org-1", KEY);

    const replay = await idempotencyService.claim(RECORD);
    expect(replay.outcome).toBe("replay");
  });

  it("treats an expired key as a brand-new request", async () => {
    await idempotencyService.claim(RECORD);
    const row = rows.get(`org-1:${KEY}`);
    row.expiresAt = new Date(Date.now() - 1000);
    await idempotencyService.complete("org-1", KEY, 200, { ok: true });

    const afterExpiry = await idempotencyService.claim(RECORD);
    expect(afterExpiry).toEqual({ outcome: "proceed" });
  });

  it("scopes keys per organization", async () => {
    await idempotencyService.claim(RECORD);
    const otherOrg = await idempotencyService.claim({ ...RECORD, organizationId: "org-2" });
    expect(otherOrg).toEqual({ outcome: "proceed" });
  });

  it("waits for an in-flight original and then replays its response", async () => {
    await idempotencyService.claim(RECORD);
    // The original finishes while the duplicate is waiting.
    setTimeout(() => {
      void idempotencyService.complete("org-1", KEY, 200, { id: "paid-1" });
    }, 50);

    const outcome = await idempotencyService.waitForCompletion(RECORD);
    expect(outcome).toEqual({ outcome: "replay", status: 200, body: { id: "paid-1" } });
  });

  it("purges expired keys", async () => {
    await idempotencyService.claim(RECORD);
    rows.get(`org-1:${KEY}`).expiresAt = new Date(Date.now() - 1000);
    expect(await idempotencyService.purgeExpired()).toBe(1);
    expect(rows.size).toBe(0);
  });
});
