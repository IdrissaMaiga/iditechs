-- Step 2 of 2, apply AFTER the tracked-links code is live (the old code still reads these
-- columns, so dropping them first would break it). Removes the Meta Graph API publishing
-- columns; click history in "campaign_clicks" is untouched. Irreversible: take a dump first.
BEGIN;
DROP INDEX IF EXISTS "campaigns_status_idx";
ALTER TABLE "campaigns"
  DROP COLUMN IF EXISTS "media_url",
  DROP COLUMN IF EXISTS "media_type",
  DROP COLUMN IF EXISTS "channels",
  DROP COLUMN IF EXISTS "utm_source",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "scheduled_at",
  DROP COLUMN IF EXISTS "published_at",
  DROP COLUMN IF EXISTS "fb_post_id",
  DROP COLUMN IF EXISTS "ig_media_id",
  DROP COLUMN IF EXISTS "last_error";
COMMIT;
