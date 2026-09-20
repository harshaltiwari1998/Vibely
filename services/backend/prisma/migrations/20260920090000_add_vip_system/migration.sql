-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'VIP_PURCHASE';

-- CreateEnum
CREATE TYPE "VipLevel" AS ENUM ('NONE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "vipLevel" "VipLevel" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "vipExpiresAt" TIMESTAMP(3);
