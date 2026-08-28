import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../cache/redis.service";
import { createLogger } from "@vibely/shared";
import { SECURITY } from "@vibely/shared";

const logger = createLogger("ProfilesService");

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async discover(query: {
    currentUserId: string;
    page?: number;
    limit?: number;
    country?: string;
    language?: string;
    gender?: string;
    online?: boolean;
    minAge?: number;
    maxAge?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const ageNow = new Date();
    const minDate = query.minAge ? new Date(ageNow.setFullYear(ageNow.getFullYear() - (query.maxAge ?? 99))) : undefined;
    const maxDate = query.maxAge ? new Date(ageNow.setFullYear(ageNow.getFullYear() - (query.minAge ?? 18))) : undefined;

    const blockedRows = await this.prisma.block.findMany({
      where: { blockerId: query.currentUserId },
      select: { blockedId: true },
    });
    const blockedIds = new Set(blockedRows.map((b) => b.blockedId));

    const where: Record<string, unknown> = {
      user: {
        id: { not: query.currentUserId },
        status: { not: "BANNED" },
        ...(query.country ? { country: query.country } : {}),
        ...(query.language ? { language: query.language } : {}),
        ...(query.gender ? { gender: query.gender } : {}),
        ...(minDate ? { dateOfBirth: { lte: minDate } } : {}),
        ...(maxDate ? { dateOfBirth: { gte: maxDate } } : {}),
      },
    };
    if (blockedIds.size > 0) {
      where.user = {
        ...(where.user as Record<string, unknown>),
        id: { not: { in: Array.from(blockedIds) } },
      };
    }

    const [rawItems, total] = await this.prisma.$transaction([
      this.prisma.profile.findMany({
        where,
        include: { user: true },
        skip: (page - 1) * limit,
        take: limit * 3,
      }),
      this.prisma.profile.count({ where }),
    ]);

    let items = rawItems;
    if (query.online !== undefined) {
      items = items.filter((p) => p.onlineStatus === (query.online ? "ONLINE" : "OFFLINE"));
    }

    const paginated = items.slice((page - 1) * limit, page * limit).map((p) => ({
      id: p.id,
      userId: p.userId,
      bio: p.bio,
      interests: p.interests,
      onlineStatus: p.onlineStatus,
      lastSeen: p.lastSeen,
      user: {
        id: p.user.id,
        username: p.user.username,
        gender: p.user.gender,
        country: p.user.country,
        language: p.user.language,
        avatarUrl: p.user.avatarUrl,
        dateOfBirth: p.user.dateOfBirth,
      },
    }));

    logger.debug("Discovery query", { page, limit, total: paginated.length, rawTotal: total });
    return { items: paginated, total: paginated.length, page, limit };
  }

  async setOnlineStatus(userId: string, status: string) {
    const valid = ["ONLINE", "OFFLINE", "BUSY", "IN_CALL"];
    if (!valid.includes(status)) throw new Error("Invalid status");
    return this.prisma.profile.update({
      where: { userId },
      data: { onlineStatus: status as never, lastSeen: new Date() },
    });
  }
}
