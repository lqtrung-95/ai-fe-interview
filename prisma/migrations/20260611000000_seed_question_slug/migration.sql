-- Stable URL slug for public /questions/[slug] pages.
-- Nullable: backfill script assigns values; unique index enforces no duplicates.
ALTER TABLE "SeedQuestion" ADD COLUMN "slug" TEXT;

CREATE UNIQUE INDEX "SeedQuestion_slug_key" ON "SeedQuestion"("slug");
