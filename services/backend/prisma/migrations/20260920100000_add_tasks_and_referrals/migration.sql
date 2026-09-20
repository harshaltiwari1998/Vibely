-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'REFERRAL_BONUS';

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DAILY_CHECKIN', 'COMPLETE_PROFILE', 'FIRST_GIFT', 'GIFT_VETERAN', 'FIRST_RECHARGE', 'GO_LIVE_ONCE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredById" TEXT;

-- CreateTable
CREATE TABLE "TaskClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "TaskClaim_userId_idx" ON "TaskClaim"("userId");

-- CreateIndex
CREATE INDEX "TaskClaim_taskType_idx" ON "TaskClaim"("taskType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskClaim" ADD CONSTRAINT "TaskClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
