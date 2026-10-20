-- Campaigns + smart-link click log. Additive only: creates two tables, touches nothing existing.
CREATE TABLE IF NOT EXISTS "campaigns" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "media_url" TEXT,
    "media_type" TEXT NOT NULL DEFAULT 'none',
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goal" TEXT NOT NULL DEFAULT 'web',
    "web_url" TEXT,
    "ios_url" TEXT,
    "android_url" TEXT,
    "whatsapp_number" TEXT,
    "whatsapp_text" TEXT,
    "form_url" TEXT,
    "utm_source" TEXT NOT NULL DEFAULT 'meta',
    "utm_medium" TEXT NOT NULL DEFAULT 'social',
    "utm_campaign" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "fb_post_id" TEXT,
    "ig_media_id" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "campaigns_slug_key" ON "campaigns"("slug");
CREATE INDEX IF NOT EXISTS "campaigns_status_idx" ON "campaigns"("status");

CREATE TABLE IF NOT EXISTS "campaign_clicks" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device" TEXT NOT NULL,
    "channel" TEXT,
    "country" TEXT,
    "referer" TEXT,
    "ip_hash" TEXT,
    CONSTRAINT "campaign_clicks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "campaign_clicks_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "campaign_clicks_campaign_id_at_idx" ON "campaign_clicks"("campaign_id", "at");
