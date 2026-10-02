-- Migration: 20261001193000_add_org_branding
-- Adds organization branding fields used by generated documents
-- (PDF reports, e-receipts and payment vouchers): postal address, contact
-- phone, contact email and a logo URL.
-- All columns are nullable so existing organizations keep working and the
-- document renderers fall back to a generated monogram when they are empty.

ALTER TABLE "Organization" ADD COLUMN "address" TEXT;
ALTER TABLE "Organization" ADD COLUMN "phone" TEXT;
ALTER TABLE "Organization" ADD COLUMN "email" TEXT;
ALTER TABLE "Organization" ADD COLUMN "logoUrl" TEXT;
