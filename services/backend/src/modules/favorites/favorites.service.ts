import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("FavoritesService");

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async favorite(ownerId: string, targetUserId: string) {
    if (ownerId === targetUserId) {
      throw new ConflictException("Cannot favorite yourself");
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("User not found");

    const fav = await this.prisma.favorite.create({
      data: { ownerId, targetUserId },
      include: {
        targetUser: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            country: true,
            language: true,
            profile: { select: { bio: true, interests: true, onlineStatus: true } },
          },
        },
      },
    });
    logger.info("User favorited", { ownerId, targetUserId });
    return fav;
  }

  async unfavorite(ownerId: string, targetUserId: string) {
    await this.prisma.favorite.deleteMany({
      where: { ownerId, targetUserId },
    });
    return { success: true };
  }

  async list(ownerId: string) {
    return this.prisma.favorite.findMany({
      where: { ownerId },
      include: {
        targetUser: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            country: true,
            language: true,
            profile: { select: { bio: true, interests: true, onlineStatus: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
