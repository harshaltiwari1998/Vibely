import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

export type LeaderboardType = "senders" | "receivers";
export type LeaderboardPeriod = "daily" | "weekly" | "all";

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  private rangeStart(period: LeaderboardPeriod): Date | undefined {
    const now = new Date();
    if (period === "daily") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (period === "weekly") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }
    return undefined;
  }

  async getLeaderboard(type: LeaderboardType, period: LeaderboardPeriod) {
    const txType = type === "senders" ? "GIFT_SENT" : "GIFT_RECEIVED";
    const start = this.rangeStart(period);

    const grouped = await this.prisma.coinTransaction.groupBy({
      by: ["userId"],
      where: { type: txType, ...(start ? { createdAt: { gte: start } } : {}) },
      _sum: { amount: true },
      // Sent amounts are stored negative, so "biggest spender" sorts ascending.
      orderBy: { _sum: { amount: type === "senders" ? "asc" : "desc" } },
      take: 50,
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped
      .filter((g) => (g._sum.amount ?? 0) !== 0)
      .map((g, index) => {
        const user = userMap.get(g.userId);
        return {
          rank: index + 1,
          userId: g.userId,
          username: user?.username ?? "Unknown",
          avatarUrl: user?.avatarUrl ?? null,
          amount: Math.abs(g._sum.amount ?? 0),
        };
      });
  }
}
