-- AlterTable: add as nullable first since existing rows need a value
ALTER TABLE "StudentProfile" ADD COLUMN     "portalToken" TEXT;

-- Backfill existing rows with a random unique token
UPDATE "StudentProfile" SET "portalToken" = md5(random()::text || clock_timestamp()::text || id) WHERE "portalToken" IS NULL;

-- Now enforce NOT NULL and uniqueness
ALTER TABLE "StudentProfile" ALTER COLUMN "portalToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_portalToken_key" ON "StudentProfile"("portalToken");
