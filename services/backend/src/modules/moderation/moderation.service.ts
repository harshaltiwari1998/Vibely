import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { UserStatus, ReportStatus } from "@prisma/client";
import { ModerationActionDto } from "@vibely/types";
import { createLogger } from "@vibely/shared";

const logger = createLogger("ModerationService");

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: RealtimeGateway,
  ) {}

  async banUser(moderatorId: string, targetUserId: string, reason: string, note?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("User not found");

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { status: UserStatus.BANNED },
      }),
      this.prisma.moderationAction.create({
        data: {
          moderatorId,
          targetUserId,
          action: "BAN",
          reason,
          note: note || null,
        },
      }),
    ]);

    await this.endActiveSessions(targetUserId);
    logger.warn("User banned", { moderatorId, targetUserId, reason });
    return { success: true, status: UserStatus.BANNED };
  }

  async suspendUser(moderatorId: string, targetUserId: string, reason: string, durationDays?: number, note?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("User not found");

    const expiresAt = durationDays ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { status: UserStatus.SUSPENDED },
      }),
      this.prisma.userBan.create({
        data: {
          userId: targetUserId,
          reason,
          expiresAt,
        },
      }),
      this.prisma.moderationAction.create({
        data: {
          moderatorId,
          targetUserId,
          action: "SUSPEND",
          reason,
          note: note || null,
        },
      }),
    ]);

    await this.endActiveSessions(targetUserId);
    logger.warn("User suspended", { moderatorId, targetUserId, reason, durationDays });
    return { success: true, status: UserStatus.SUSPENDED, expiresAt };
  }

  async restrictUser(moderatorId: string, targetUserId: string, reason: string, note?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("User not found");

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { status: UserStatus.RESTRICTED },
      }),
      this.prisma.moderationAction.create({
        data: {
          moderatorId,
          targetUserId,
          action: "RESTRICT",
          reason,
          note: note || null,
        },
      }),
    ]);

    logger.warn("User restricted", { moderatorId, targetUserId, reason });
    return { success: true, status: UserStatus.RESTRICTED };
  }

  async unbanUser(moderatorId: string, targetUserId: string, note?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("User not found");

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { status: UserStatus.ACTIVE },
      }),
      this.prisma.userBan.deleteMany({ where: { userId: targetUserId } }),
      this.prisma.moderationAction.create({
        data: {
          moderatorId,
          targetUserId,
          action: "UNBAN",
          reason: "Appealed / reviewed",
          note: note || null,
        },
      }),
    ]);

    logger.info("User unbanned", { moderatorId, targetUserId });
    return { success: true, status: UserStatus.ACTIVE };
  }

  async listActions(query: { page?: number; limit?: number; moderatorId?: string; targetUserId?: string } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = {};
    if (query.moderatorId) where.moderatorId = query.moderatorId;
    if (query.targetUserId) where.targetUserId = query.targetUserId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.moderationAction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          moderator: { select: { id: true, username: true } },
          targetUser: { select: { id: true, username: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.moderationAction.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async moderateText(text: string): Promise<{ flagged: boolean; categories: string[]; confidence: number }> {
    if (!text || text.trim().length === 0) {
      return { flagged: false, categories: [], confidence: 0 };
    }

    const lowerText = text.toLowerCase();
    const categories: string[] = [];
    const suspiciousPatterns = [
      { pattern: /scam|fraud|verify.*account|send.*money/gi, category: "SCAM" },
      { pattern: /harass|threat|kill|die|abuse/gi, category: "HARASSMENT" },
      { pattern: /hate|racial|slur|discriminat/gi, category: "HATE_SPEECH" },
      { pattern: /nude|sexual|explicit|nsfw/gi, category: "INAPPROPRIATE" },
      { pattern: /password|credit card|ssn|social security/gi, category: "PRIVACY" },
    ];

    for (const { pattern, category } of suspiciousPatterns) {
      if (pattern.test(lowerText)) {
        categories.push(category);
      }
    }

    const flagged = categories.length > 0;
    const confidence = flagged ? 0.7 : 0;

    if (flagged) {
      logger.debug("Text moderation flagged", { categories, textLength: text.length });
    }

    return { flagged, categories, confidence };
  }

  async checkUserStatus(userId: string): Promise<UserStatus> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    return user?.status || UserStatus.ACTIVE;
  }

  async isUserRestricted(userId: string): Promise<boolean> {
    const status = await this.checkUserStatus(userId);
    return status === UserStatus.RESTRICTED || status === UserStatus.SUSPENDED || status === UserStatus.BANNED;
  }

  private async endActiveSessions(userId: string) {
    try {
      if (this.gateway) {
        this.gateway.server.to(userId).emit(RealtimeEvent.UserOffline, { userId, at: new Date().toISOString() });
      }
    } catch {
      // ignore socket errors
    }
  }
}
