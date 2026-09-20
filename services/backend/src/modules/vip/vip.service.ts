import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { VipLevel } from "@prisma/client";

interface VipTierDef {
  level: VipLevel;
  name: string;
  cost: number;
  durationDays: number;
  perks: string[];
}

const VIP_TIERS: VipTierDef[] = [
  { level: "BRONZE", name: "Bronze", cost: 5000, durationDays: 30, perks: ["VIP badge on profile", "Priority in match queue"] },
  { level: "SILVER", name: "Silver", cost: 15000, durationDays: 30, perks: ["All Bronze perks", "Exclusive entry effect", "10% gift discount"] },
  { level: "GOLD", name: "Gold", cost: 40000, durationDays: 30, perks: ["All Silver perks", "Golden name color", "1 free daily gift"] },
  { level: "PLATINUM", name: "Platinum", cost: 100000, durationDays: 30, perks: ["All Gold perks", "Top-of-list visibility", "Dedicated support"] },
];

const RANK: Record<VipLevel, number> = { NONE: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4 };

/** Silver and up get the "10% gift discount" perk (see VIP_TIERS perk copy). */
const GIFT_DISCOUNT_PERCENT: Partial<Record<VipLevel, number>> = {
  SILVER: 10,
  GOLD: 10,
  PLATINUM: 10,
};

@Injectable()
export class VipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  getTiers() {
    return VIP_TIERS;
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { vipLevel: true, vipExpiresAt: true },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isActive = user.vipLevel !== "NONE" && !!user.vipExpiresAt && user.vipExpiresAt > new Date();
    return {
      level: isActive ? user.vipLevel : "NONE",
      expiresAt: isActive ? user.vipExpiresAt : null,
      isActive,
      perks: isActive ? VIP_TIERS.find((t) => t.level === user.vipLevel)?.perks ?? [] : [],
    };
  }

  /** Returns the active gift-discount percentage (0-100) for a user, 0 if not VIP or tier has no discount perk. */
  async getGiftDiscountPercent(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { vipLevel: true, vipExpiresAt: true },
    });
    if (!user) {
      return 0;
    }
    const isActive = user.vipLevel !== "NONE" && !!user.vipExpiresAt && user.vipExpiresAt > new Date();
    if (!isActive) {
      return 0;
    }
    return GIFT_DISCOUNT_PERCENT[user.vipLevel] ?? 0;
  }

  async purchase(userId: string, level: VipLevel) {
    const tier = VIP_TIERS.find((t) => t.level === level);
    if (!tier) {
      throw new BadRequestException("Invalid VIP tier");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { vipLevel: true, vipExpiresAt: true },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.wallet.deductCoins(userId, tier.cost, "VIP_PURCHASE", `vip:${level}`);

    const now = new Date();
    const currentlyActive = user.vipLevel !== "NONE" && !!user.vipExpiresAt && user.vipExpiresAt > now;
    const extendFrom = currentlyActive && RANK[user.vipLevel] === RANK[level] ? user.vipExpiresAt! : now;
    const expiresAt = new Date(extendFrom.getTime() + tier.durationDays * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { vipLevel: level, vipExpiresAt: expiresAt },
      select: { vipLevel: true, vipExpiresAt: true },
    });

    return {
      level: updated.vipLevel,
      expiresAt: updated.vipExpiresAt,
      isActive: true,
      perks: tier.perks,
    };
  }
}
