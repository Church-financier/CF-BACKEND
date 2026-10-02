-- Remove member-facing payment gateway integration.
-- Church Financier is an internal ledger system; member contributions
-- are recorded manually, never processed via external gateways.

DROP TABLE IF EXISTS "PaymentGateway";

DROP TYPE IF EXISTS "PaymentProvider";
