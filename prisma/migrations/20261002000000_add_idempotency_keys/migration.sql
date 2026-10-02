-- Migration: 20261002000000_add_idempotency_keys
-- Duplicate-payment prevention, part 1/2 (schema).
--
-- Stores one row per processed `X-Idempotency-Key` so a retried or
-- double-clicked financial request replays its stored response instead of
-- posting a second ledger/disbursement entry.
--
-- `responseStatus` is NULL while the first request is still in flight, which
-- is how a concurrent duplicate is told apart from a completed one.
-- `requestHash` guards against a key being replayed with a different payload.
-- `expiresAt` bounds the replay window; rows past it are treated as new.

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_organizationId_key_key" ON "IdempotencyKey"("organizationId", "key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_createdAt_idx" ON "IdempotencyKey"("createdAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");
