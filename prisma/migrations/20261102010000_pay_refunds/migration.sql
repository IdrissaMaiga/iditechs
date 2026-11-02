-- IDITECHS Pay: refunds and card disputes (chargebacks) after a success. Additive only.
ALTER TABLE "pay_payments" ADD COLUMN IF NOT EXISTS "amount_refunded" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pay_payments" ADD COLUMN IF NOT EXISTS "dispute_status" TEXT;
ALTER TABLE "pay_payments" ADD COLUMN IF NOT EXISTS "dispute_amount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "pay_payments_payment_intent_idx" ON "pay_payments" (("provider_data"->>'payment_intent'));
