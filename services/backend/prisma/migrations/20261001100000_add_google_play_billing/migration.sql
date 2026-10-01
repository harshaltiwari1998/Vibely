-- AlterTable
ALTER TABLE "CoinPackage" ADD COLUMN "playProductId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "externalTransactionToken" TEXT,
ADD COLUMN "googleReportedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "CoinPackage_playProductId_key" ON "CoinPackage"("playProductId");

-- Backfill: give each existing package a Play product ID derived from its coin
-- count (e.g. coins_500), skipping any coin count shared by several packages.
UPDATE "CoinPackage" p SET "playProductId" = 'coins_' || p."coins"
WHERE (SELECT count(*) FROM "CoinPackage" q WHERE q."coins" = p."coins") = 1;
