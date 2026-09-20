-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'CALL_CHARGE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatPricePerMinute" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "beans" INTEGER NOT NULL DEFAULT 0;
