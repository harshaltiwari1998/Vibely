import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

/** Cumulative XP required to reach a given level. Quadratic growth, level 1 starts at 0 XP. */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async awardXp(userId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      return;
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    });
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const level = levelFromXp(user.xp);
    const currentLevelFloor = xpForLevel(level);
    const nextLevelFloor = xpForLevel(level + 1);
    return {
      xp: user.xp,
      level,
      currentLevelXp: user.xp - currentLevelFloor,
      xpToNextLevel: nextLevelFloor - currentLevelFloor,
    };
  }

  async getLeaderboard(limit = 20) {
    const users = await this.prisma.user.findMany({
      orderBy: { xp: "desc" },
      take: limit,
      select: { id: true, username: true, avatarUrl: true, xp: true },
    });
    return users.map((u) => ({ ...u, level: levelFromXp(u.xp) }));
  }
}
