import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { levelFromXp } from "../levels/levels.service";

interface BadgeStats {
  giftsSent: number;
  giftsReceived: number;
  liveCount: number;
  level: number;
  isVip: boolean;
  inFamily: boolean;
}

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: BadgeStats) => boolean;
}

const BADGE_DEFS: BadgeDef[] = [
  { id: "NEWCOMER", name: "Newcomer", description: "Joined Vibely", icon: "🌱", check: () => true },
  { id: "FIRST_GIFT", name: "First Gift", description: "Sent your first gift", icon: "🎁", check: (s) => s.giftsSent >= 1 },
  { id: "GIFT_VETERAN", name: "Gift Veteran", description: "Sent 10 gifts", icon: "⭐", check: (s) => s.giftsSent >= 10 },
  { id: "GIFT_LEGEND", name: "Gift Legend", description: "Sent 100 gifts", icon: "👑", check: (s) => s.giftsSent >= 100 },
  { id: "POPULAR", name: "Popular", description: "Received 10 gifts", icon: "💖", check: (s) => s.giftsReceived >= 10 },
  { id: "VIP_MEMBER", name: "VIP Member", description: "Active VIP subscriber", icon: "💎", check: (s) => s.isVip },
  { id: "LIVE_STAR", name: "Live Star", description: "Hosted a live room", icon: "🔴", check: (s) => s.liveCount >= 1 },
  { id: "LEVEL_10", name: "Rising Star", description: "Reached level 10", icon: "🥉", check: (s) => s.level >= 10 },
  { id: "LEVEL_25", name: "Elite", description: "Reached level 25", icon: "🥈", check: (s) => s.level >= 25 },
  { id: "LEVEL_50", name: "Legend", description: "Reached level 50", icon: "🥇", check: (s) => s.level >= 50 },
  { id: "FAMILY_MEMBER", name: "Family", description: "Joined a family", icon: "🏠", check: (s) => s.inFamily },
];

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getStats(userId: string): Promise<BadgeStats> {
    const [user, giftsSent, giftsReceived, liveCount] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, vipLevel: true, vipExpiresAt: true, familyId: true, featuredBadgeId: true },
      }),
      this.prisma.giftTransaction.count({ where: { senderId: userId } }),
      this.prisma.giftTransaction.count({ where: { receiverId: userId } }),
      this.prisma.liveRoom.count({ where: { hostId: userId } }),
    ]);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isVip = user.vipLevel !== "NONE" && !!user.vipExpiresAt && user.vipExpiresAt > new Date();
    return {
      giftsSent,
      giftsReceived,
      liveCount,
      level: levelFromXp(user.xp),
      isVip,
      inFamily: !!user.familyId,
    };
  }

  async getMyBadges(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { featuredBadgeId: true } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const stats = await this.getStats(userId);
    const badges = BADGE_DEFS.map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      earned: def.check(stats),
    }));
    return { badges, featuredBadgeId: user.featuredBadgeId };
  }

  async setFeaturedBadge(userId: string, badgeId: string | null) {
    if (badgeId !== null) {
      const def = BADGE_DEFS.find((b) => b.id === badgeId);
      if (!def) {
        throw new BadRequestException("Unknown badge");
      }
      const stats = await this.getStats(userId);
      if (!def.check(stats)) {
        throw new BadRequestException("You haven't earned this badge yet");
      }
    }
    await this.prisma.user.update({ where: { id: userId }, data: { featuredBadgeId: badgeId } });
    return { featuredBadgeId: badgeId };
  }
}
