-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'MALL_PURCHASE';

-- CreateEnum
CREATE TYPE "MallItemCategory" AS ENUM ('HEADWEAR', 'RIDE', 'PROFILE_DECORATION');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "featuredBadgeId" TEXT,
ADD COLUMN     "familyId" TEXT;

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MallItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MallItemCategory" NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MallItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MallInventoryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MallInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_name_key" ON "Family"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Family_ownerId_key" ON "Family"("ownerId");

-- CreateIndex
CREATE INDEX "MallInventoryItem_userId_idx" ON "MallInventoryItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MallInventoryItem_userId_itemId_key" ON "MallInventoryItem"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MallInventoryItem" ADD CONSTRAINT "MallInventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MallInventoryItem" ADD CONSTRAINT "MallInventoryItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MallItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
