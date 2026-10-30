-- Step 1 of 2, apply BEFORE deploying the tracked-links code. Additive only: the running
-- (Meta) code ignores the new column, so this is safe at any time.
-- Adds "listed" (show on /links), seeded from the old published status, and makes body optional.
BEGIN;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "listed" BOOLEAN NOT NULL DEFAULT false;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'status') THEN
    UPDATE "campaigns" SET "listed" = ("status" = 'published');
  END IF;
END $$;
ALTER TABLE "campaigns" ALTER COLUMN "body" DROP NOT NULL;
COMMIT;
