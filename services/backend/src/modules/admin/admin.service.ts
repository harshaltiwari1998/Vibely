import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../cache/redis.service";
import { UserStatus, ReportStatus } from "@prisma/client";
import { createLogger } from "@vibely/shared";

const logger = createLogger("AdminService");

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async listUsers(query: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = {};
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.status) where.status = query.status as UserStatus;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          dateOfBirth: true,
          gender: true,
          country: true,
          language: true,
          avatarUrl: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          profile: { select: { onlineStatus: true, bio: true } },
          _count: { select: { sentReports: true, receivedReports: true, blocksMade: true, payments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        dateOfBirth: true,
        gender: true,
        country: true,
        language: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        preferences: true,
        sessions: { select: { id: true, deviceId: true, ipAddress: true, createdAt: true } },
        devices: { select: { id: true, platform: true, pushToken: true, createdAt: true } },
        wallet: { select: { id: true, balance: true } },
        _count: { select: { sentReports: true, receivedReports: true, blocksMade: true, payments: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateUserStatus(adminId: string, userId: string, status: UserStatus, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status },
      }),
      this.prisma.moderationAction.create({
        data: {
          moderatorId: adminId,
          targetUserId: userId,
          action: status === UserStatus.BANNED ? "BAN" : status === UserStatus.SUSPENDED ? "SUSPEND" : status === UserStatus.RESTRICTED ? "RESTRICT" : "UNBAN",
          reason: reason || `Status changed to ${status}`,
        },
      }),
    ]);

    if (status === UserStatus.BANNED || status === UserStatus.SUSPENDED) {
      await this.notifyUserOffline(userId);
    }

    logger.info("User status updated by admin", { adminId, userId, status, reason });
    return { success: true, status };
  }

  async getStats() {
    const [
      totalUsers,
      activeUsers,
      onlineUsers,
      totalCalls,
      totalMessages,
      totalCoinsPurchased,
      totalGiftsSent,
      totalReports,
      bannedUsers,
      restrictedUsers,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.profile.count({ where: { onlineStatus: "ONLINE" } }),
      this.prisma.call.count(),
      this.prisma.message.count(),
      this.prisma.coinTransaction.aggregate({ where: { type: "PURCHASE" }, _sum: { amount: true } }),
      this.prisma.giftTransaction.count(),
      this.prisma.report.count(),
      this.prisma.user.count({ where: { status: UserStatus.BANNED } }),
      this.prisma.user.count({ where: { status: UserStatus.RESTRICTED } }),
    ]);

    const onlineCount = await this.getOnlineCountFromRedis();

    return {
      totalUsers,
      activeUsers,
      onlineUsers: onlineCount,
      calls: totalCalls,
      messages: totalMessages,
      coinsPurchased: totalCoinsPurchased._sum.amount || 0,
      giftsSent: totalGiftsSent,
      reports: totalReports,
      bannedUsers,
      restrictedUsers,
    };
  }

  async listReports(query: { page?: number; limit?: number; status?: string } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.status ? { status: query.status as ReportStatus } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: { select: { id: true, username: true, email: true } },
          targetUser: { select: { id: true, username: true, email: true, status: true } },
          assignedTo: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async listCalls(query: { page?: number; limit?: number } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.call.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          initiator: { select: { id: true, username: true } },
          receiver: { select: { id: true, username: true } },
        },
        orderBy: { startedAt: "desc" },
      }),
      this.prisma.call.count(),
    ]);

    return { items, total, page, limit };
  }

  async listMessages(query: { page?: number; limit?: number } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: { select: { id: true, username: true } },
          chat: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.message.count(),
    ]);

    return { items, total, page, limit };
  }

  async listTransactions(query: { page?: number; limit?: number } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.coinTransaction.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.coinTransaction.count(),
    ]);

    return { items, total, page, limit };
  }

  async listGifts() {
    return this.prisma.gift.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
    });
  }

  async listModerationActions(query: { page?: number; limit?: number } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.moderationAction.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          moderator: { select: { id: true, username: true } },
          targetUser: { select: { id: true, username: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.moderationAction.count(),
    ]);

    return { items, total, page, limit };
  }

  async getSettings() {
    return {
      appName: process.env.APP_NAME || "Vibely",
      minAge: 18,
      maxAge: 120,
      allowRegistration: true,
      maintenanceMode: false,
      features: {
        matching: true,
        calls: true,
        chat: true,
        gifts: true,
        payments: true,
      },
    };
  }

  async updateSettings(_adminId: string, settings: Record<string, any>) {
    logger.info("Admin settings updated", { settings });
    return { success: true, settings };
  }

  async detectSuspiciousActivity(userId: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentReports, recentGifts, recentPayments, recentMessages] = await Promise.all([
      this.prisma.report.count({ where: { reporterId: userId, createdAt: { gte: oneDayAgo } } }),
      this.prisma.giftTransaction.count({ where: { senderId: userId, createdAt: { gte: oneDayAgo } } }),
      this.prisma.payment.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
      this.prisma.message.count({ where: { senderId: userId, createdAt: { gte: oneDayAgo } } }),
    ]);

    const flags: string[] = [];
    if (recentReports > 10) flags.push("HIGH_REPORT_RATE");
    if (recentGifts > 50) flags.push("HIGH_GIFT_VOLUME");
    if (recentPayments > 20) flags.push("HIGH_PAYMENT_VOLUME");
    if (recentMessages > 500) flags.push("HIGH_MESSAGE_VOLUME");

    const riskScore = flags.length * 25;

    return {
      userId,
      flags,
      riskScore: Math.min(riskScore, 100),
      metrics: { recentReports, recentGifts, recentPayments, recentMessages },
      recommendation: riskScore >= 75 ? "REVIEW" : riskScore >= 50 ? "MONITOR" : "OK",
    };
  }

  private async getOnlineCountFromRedis(): Promise<number> {
    try {
      if (!this.redis.isReady()) return 0;
      const client = this.redis.getClient();
      if (!client) return 0;
      const keys = await client.keys("presence:*");
      return keys.length;
    } catch {
      return 0;
    }
  }

  private async notifyUserOffline(userId: string) {
    try {
      this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED } });
    } catch {
      // ignore
    }
  }
}
