import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../cache/redis.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("FraudDetectionService");

interface SuspiciousActivity {
  userId: string;
  flags: string[];
  riskScore: number;
  recommendation: "OK" | "MONITOR" | "REVIEW" | "BLOCK";
  metrics: Record<string, number>;
}

@Injectable()
export class FraudDetectionService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async analyzeUser(userId: string): Promise<SuspiciousActivity> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [
      recentReports,
      recentGifts,
      recentPayments,
      recentMessages,
      recentLogins,
      accountAge,
    ] = await Promise.all([
      this.prisma.report.count({ where: { reporterId: userId, createdAt: { gte: oneDayAgo } } }),
      this.prisma.giftTransaction.count({ where: { senderId: userId, createdAt: { gte: oneDayAgo } } }),
      this.prisma.payment.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
      this.prisma.message.count({ where: { senderId: userId, createdAt: { gte: oneHourAgo } } }),
      this.prisma.userSession.count({ where: { userId, createdAt: { gte: oneDayAgo } } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    ]);

    const flags: string[] = [];
    if (recentReports > 10) flags.push("HIGH_REPORT_RATE");
    if (recentGifts > 100) flags.push("HIGH_GIFT_VOLUME");
    if (recentPayments > 20) flags.push("HIGH_PAYMENT_VOLUME");
    if (recentMessages > 1000) flags.push("HIGH_MESSAGE_VOLUME");
    if (recentLogins > 50) flags.push("HIGH_LOGIN_VOLUME");
    if (accountAge && (Date.now() - accountAge.createdAt.getTime()) < 24 * 60 * 60 * 1000) {
      flags.push("NEW_ACCOUNT_HIGH_ACTIVITY");
    }

    const riskScore = this.calculateRiskScore(flags, { recentReports, recentGifts, recentPayments, recentMessages, recentLogins });

    let recommendation: SuspiciousActivity["recommendation"] = "OK";
    if (riskScore >= 80) recommendation = "BLOCK";
    else if (riskScore >= 60) recommendation = "REVIEW";
    else if (riskScore >= 40) recommendation = "MONITOR";

    return {
      userId,
      flags,
      riskScore,
      recommendation,
      metrics: { recentReports, recentGifts, recentPayments, recentMessages, recentLogins },
    };
  }

  async detectPaymentFraud(paymentId: string): Promise<{ flagged: boolean; reasons: string[] }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      return { flagged: false, reasons: ["Payment not found"] };
    }

    const reasons: string[] = [];
    const userPayments = await this.prisma.payment.count({
      where: { userId: payment.userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    if (userPayments > 10) reasons.push("HIGH_PAYMENT_FREQUENCY");
    if (payment.amount > 100000) reasons.push("HIGH_PAYMENT_AMOUNT");

    const existingIdempotency = await this.prisma.payment.findFirst({
      where: { idempotencyKey: payment.idempotencyKey, id: { not: payment.id } },
    });
    if (existingIdempotency) reasons.push("DUPLICATE_IDEMPOTENCY_KEY");

    return { flagged: reasons.length > 0, reasons };
  }

  async detectGiftFraud(giftId: string): Promise<{ flagged: boolean; reasons: string[] }> {
    const gift = await this.prisma.giftTransaction.findUnique({
      where: { id: giftId },
      include: { sender: true, receiver: true },
    });

    if (!gift) {
      return { flagged: false, reasons: ["Gift not found"] };
    }

    const reasons: string[] = [];
    const senderGifts = await this.prisma.giftTransaction.count({
      where: { senderId: gift.senderId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });

    if (senderGifts > 50) reasons.push("HIGH_GIFT_FREQUENCY");

    return { flagged: reasons.length > 0, reasons };
  }

  private calculateRiskScore(flags: string[], metrics: Record<string, number>): number {
    let score = 0;
    const weights: Record<string, number> = {
      HIGH_REPORT_RATE: 30,
      HIGH_GIFT_VOLUME: 15,
      HIGH_PAYMENT_VOLUME: 25,
      HIGH_MESSAGE_VOLUME: 10,
      HIGH_LOGIN_VOLUME: 20,
      NEW_ACCOUNT_HIGH_ACTIVITY: 35,
    };

    for (const flag of flags) {
      score += weights[flag] || 10;
    }

    return Math.min(score, 100);
  }
}
