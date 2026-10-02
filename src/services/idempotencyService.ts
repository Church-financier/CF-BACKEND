import { createHash } from "crypto";
import { prisma } from "../lib/prisma";
import { isPrismaKnownError } from "../utils/prismaErrors";

/**
 * Replay window for a processed idempotency key. A key is honoured until it
 * expires; after that the same value is treated as a brand-new request so a
 * stale client cannot be permanently locked out of an action.
 */
const REPLAY_WINDOW_HOURS = Number(process.env.IDEMPOTENCY_WINDOW_HOURS ?? 24);

/** How long a duplicate waits for the in-flight original to finish. */
const IN_FLIGHT_POLL_ATTEMPTS = 10;
const IN_FLIGHT_POLL_INTERVAL_MS = 200;

export interface IdempotencyRecordInput {
  key: string;
  userId: string;
  organizationId: string;
  endpoint: string;
  requestHash: string;
}

export type ClaimOutcome =
  | { outcome: "proceed" }
  | { outcome: "replay"; status: number; body: unknown }
  | { outcome: "in_progress" }
  | { outcome: "key_reuse" };

/** UUID v4, the format the client is required to send. */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidIdempotencyKey(key: string): boolean {
  return UUID_V4.test(key);
}

/**
 * Stable fingerprint of a request. Used to detect a key being replayed with a
 * different payload, which is a client bug rather than a retry.
 */
export function hashRequest(input: {
  method: string;
  path: string;
  body: unknown;
}): string {
  return createHash("sha256")
    .update(input.method.toUpperCase())
    .update("\n")
    .update(input.path)
    .update("\n")
    .update(stableStringify(input.body))
    .digest("hex");
}

/** Key-order-independent JSON so `{a,b}` and `{b,a}` hash identically. */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

function replayWindowExpiry(): Date {
  return new Date(Date.now() + REPLAY_WINDOW_HOURS * 60 * 60 * 1000);
}

async function attemptInsert(input: IdempotencyRecordInput): Promise<boolean> {
  try {
    await prisma.idempotencyKey.create({
      data: {
        key: input.key,
        userId: input.userId,
        organizationId: input.organizationId,
        endpoint: input.endpoint,
        requestHash: input.requestHash,
        expiresAt: replayWindowExpiry(),
      },
    });
    return true;
  } catch (err) {
    if (isPrismaKnownError(err) && err.code === "P2002") return false;
    throw err;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const idempotencyService = {
  /**
   * Claims a key for this request.
   *
   * - `proceed`      the caller owns the key and must later call `complete`
   *                  or `release`.
   * - `replay`       a previous identical request already succeeded; the stored
   *                  response is returned verbatim and nothing is re-executed.
   * - `in_progress`  an identical request is still running; the caller polls
   *                  briefly and then reports a conflict.
   * - `key_reuse`    the same key was sent with a different payload.
   */
  async claim(input: IdempotencyRecordInput): Promise<ClaimOutcome> {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (await attemptInsert(input)) return { outcome: "proceed" };

      const existing = await prisma.idempotencyKey.findUnique({
        where: { organizationId_key: { organizationId: input.organizationId, key: input.key } },
      });

      // Vanished between the failed insert and this read, or outside its
      // replay window: the key is free again.
      if (!existing || existing.expiresAt.getTime() <= Date.now()) {
        if (existing) {
          await prisma.idempotencyKey
            .delete({ where: { id: existing.id } })
            .catch(() => undefined);
        }
        continue;
      }

      if (existing.requestHash !== input.requestHash) {
        return { outcome: "key_reuse" };
      }

      if (existing.responseStatus !== null) {
        return { outcome: "replay", status: existing.responseStatus, body: existing.responseBody };
      }

      return { outcome: "in_progress" };
    }

    // Two claim attempts collided with expiring rows; report it as in flight
    // rather than risking a double execution.
    return { outcome: "in_progress" };
  },

  /**
   * Waits for an in-flight duplicate to finish so a fast double-click gets the
   * cached response instead of a conflict. Returns `in_progress` if the
   * original is still running after the wait.
   */
  async waitForCompletion(input: IdempotencyRecordInput): Promise<ClaimOutcome> {
    for (let i = 0; i < IN_FLIGHT_POLL_ATTEMPTS; i++) {
      await sleep(IN_FLIGHT_POLL_INTERVAL_MS);
      const existing = await prisma.idempotencyKey.findUnique({
        where: { organizationId_key: { organizationId: input.organizationId, key: input.key } },
      });
      if (!existing || existing.expiresAt.getTime() <= Date.now()) {
        return this.claim(input);
      }
      if (existing.requestHash !== input.requestHash) return { outcome: "key_reuse" };
      if (existing.responseStatus !== null) {
        return { outcome: "replay", status: existing.responseStatus, body: existing.responseBody };
      }
    }
    return { outcome: "in_progress" };
  },

  /** Persists the response so later replays of this key return it verbatim. */
  async complete(
    organizationId: string,
    key: string,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    await prisma.idempotencyKey
      .updateMany({
        where: { organizationId, key, responseStatus: null },
        data: {
          responseStatus,
          responseBody: (responseBody ?? null) as never,
        },
      })
      .catch((err) => {
        // Losing the cache entry must never fail an already-committed
        // financial write; the transaction is the source of truth.
        console.error("[idempotency] failed to store response", err);
      });
  },

  /**
   * Releases a claim whose request failed, so the client can retry the same
   * logical operation (failed requests are not cached).
   */
  async release(organizationId: string, key: string): Promise<void> {
    await prisma.idempotencyKey
      .deleteMany({ where: { organizationId, key, responseStatus: null } })
      .catch((err) => console.error("[idempotency] failed to release key", err));
  },

  /** Housekeeping: drops rows outside their replay window. */
  async purgeExpired(): Promise<number> {
    const result = await prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    return result.count;
  },
};
