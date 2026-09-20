import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { LevelsService } from "../levels/levels.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("ReferralsService");

const REFERRER_BONUS = 100;
const REFEREE_BONUS = 50;

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly levels: LevelsService,
  ) {}

  private codeFor(userId: string): string {
    return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  }

  async getMyReferralInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    let code = user.referralCode;
    if (!code) {
      code = this.codeFor(userId);
      await this.prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
    }

    const [invitedCount, earnedAgg] = await Promise.all([
      this.prisma.user.count({ where: { referredById: userId } }),
      this.prisma.coinTransaction.aggregate({
        where: { userId, type: "REFERRAL_BONUS" },
        _sum: { amount: true },
      }),
    ]);

    return {
      code,
      invitedCount,
      totalEarned: earnedAgg._sum.amount ?? 0,
      referrerBonus: REFERRER_BONUS,
      refereeBonus: REFEREE_BONUS,
    };
  }

  /**
   * Called right after a new user registers with a referral code. Invalid or
   * self-referral codes are ignored rather than failing registration.
   */
  async applyReferral(newUserId: string, code: string): Promise<void> {
    const referrer = await this.prisma.user.findUnique({ where: { referralCode: code.toUpperCase() } });
    if (!referrer || referrer.id === newUserId) {
      return;
    }

    await this.prisma.user.update({ where: { id: newUserId }, data: { referredById: referrer.id } });
    await this.wallet.addCoins(referrer.id, REFERRER_BONUS, "REFERRAL_BONUS", `referral:${newUserId}`);
    await this.wallet.addCoins(newUserId, REFEREE_BONUS, "REFERRAL_BONUS", `referral:${referrer.id}`);
    await Promise.all([this.levels.awardXp(referrer.id, 25), this.levels.awardXp(newUserId, 10)]);

    logger.info("Referral applied", { referrerId: referrer.id, newUserId });
  }
}
