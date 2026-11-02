-- IDITECHS Pay. Additive only: creates four pay_* tables, touches nothing existing.
CREATE TABLE IF NOT EXISTS "pay_apps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "api_key_prefix" TEXT NOT NULL,
    "webhook_url" TEXT,
    "webhook_secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pay_apps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "pay_apps_api_key_hash_key" ON "pay_apps"("api_key_hash");

CREATE TABLE IF NOT EXISTS "pay_payments" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider_ref" TEXT,
    "provider_data" JSONB NOT NULL DEFAULT '{}',
    "checkout_url" TEXT,
    "return_url" TEXT NOT NULL,
    "cancel_url" TEXT,
    "customer" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "pay_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pay_payments_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "pay_apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pay_payments_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "pay_payments_status_check" CHECK ("status" IN ('pending', 'succeeded', 'failed', 'cancelled', 'expired'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "pay_payments_app_id_reference_key" ON "pay_payments"("app_id", "reference");
CREATE INDEX IF NOT EXISTS "pay_payments_provider_provider_ref_idx" ON "pay_payments"("provider", "provider_ref");

CREATE TABLE IF NOT EXISTS "pay_events" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pay_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pay_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "pay_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "pay_events_payment_id_idx" ON "pay_events"("payment_id");

CREATE TABLE IF NOT EXISTS "pay_deliveries" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_status" INTEGER,
    "last_error" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pay_deliveries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pay_deliveries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "pay_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pay_deliveries_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "pay_apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "pay_deliveries_next_attempt_at_idx" ON "pay_deliveries"("next_attempt_at");
