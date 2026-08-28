import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("BlocksService");

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new ConflictException("Cannot block yourself");
    }
    const target = await this.prisma.user.findUnique({ where: { id: blockedId } });
    if (!target) throw new NotFoundException("User not found");

    const block = await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
      include: {
        blocked: {
          select: { id: true, username: true, avatarUrl: true, country: true, language: true },
        },
      },
    });

    await this.prisma.favorite.deleteMany({
      where: {
        OR: [
          { ownerId: blockerId, targetUserId: blockedId },
          { ownerId: blockedId, targetUserId: blockerId },
        ],
      },
    });

    logger.info("User blocked", { blockerId, blockedId });
    return block;
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
    return { success: true };
  }

  async list(userId: string) {
    return this.prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { id: true, username: true, avatarUrl: true, country: true, language: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
