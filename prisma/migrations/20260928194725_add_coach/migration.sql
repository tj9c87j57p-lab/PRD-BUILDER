-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "googleRefreshToken" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coach_email_key" ON "Coach"("email");

-- Seed a default Coach from the earliest User (the existing admin) so
-- existing AvailabilityWindow/BlockedDate/Booking rows have somewhere
-- to attach to. googleRefreshToken is left NULL here on purpose — the
-- app falls back to the legacy GOOGLE_REFRESH_TOKEN env var when a
-- Coach has no refreshToken of its own, so the primary coach keeps
-- working without re-authorizing. A no-op on a fresh install (no rows).
INSERT INTO "Coach" ("id", "name", "email", "active", "createdAt", "updatedAt")
SELECT 'coach_seed_primary', "name", "email", true, now(), now()
FROM "User"
ORDER BY "createdAt" ASC
LIMIT 1
ON CONFLICT DO NOTHING;

-- DropIndex
DROP INDEX "AvailabilityWindow_dayOfWeek_idx";

-- DropIndex
DROP INDEX "BlockedDate_startDate_endDate_idx";

-- AlterTable: add nullable first so existing rows aren't rejected
ALTER TABLE "AvailabilityWindow" ADD COLUMN "coachId" TEXT;
ALTER TABLE "BlockedDate" ADD COLUMN "coachId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "coachId" TEXT;

-- Backfill existing rows onto the seeded default coach (no-op if that
-- coach was never inserted, i.e. a fresh install with no prior User row)
UPDATE "AvailabilityWindow" SET "coachId" = 'coach_seed_primary' WHERE "coachId" IS NULL;
UPDATE "BlockedDate" SET "coachId" = 'coach_seed_primary' WHERE "coachId" IS NULL;
UPDATE "Booking" SET "coachId" = 'coach_seed_primary' WHERE "coachId" IS NULL;

-- Now enforce NOT NULL now that every existing row has a value
ALTER TABLE "AvailabilityWindow" ALTER COLUMN "coachId" SET NOT NULL;
ALTER TABLE "BlockedDate" ALTER COLUMN "coachId" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "coachId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "AvailabilityWindow_coachId_dayOfWeek_idx" ON "AvailabilityWindow"("coachId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "BlockedDate_coachId_startDate_endDate_idx" ON "BlockedDate"("coachId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_coachId_idx" ON "Booking"("coachId");

-- AddForeignKey
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedDate" ADD CONSTRAINT "BlockedDate_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
