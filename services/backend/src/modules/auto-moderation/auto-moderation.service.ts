import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { FraudDetectionService } from "../fraud/fraud-detection.service";
import { ModerationService } from "../moderation/moderation.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("AutoModerationService");

const SYSTEM_ACCOUNT_EMAIL = "system@vibely.internal";
const REPORT_WINDOW_DAYS = 7;
const REPORT_RESTRICT_THRESHOLD = 3;
const REPORT_SUSPEND_THRESHOLD = 6;
const AUTO_SUSPEND_DAYS = 7;

/**
 * Ties the (already-existing, previously admin-only) fraud scoring and report
 * queues into real account actions. Policy, by design, never auto-bans: the
 * first strike restricts the account (blocks wallet/gifts/live), a repeat
 * strike auto-suspends for a week pending manual review, and only a human
 * moderator can ban. This keeps false positives recoverable.
 */
@Injectable()
export class AutoModerationService {
  private systemUserId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fraud: FraudDetectionService,
    private readonly moderation: ModerationService,
  ) {}

  /** Run after a payment succeeds — checks the payer's broader fraud signal, not just this one charge. */
  async checkUserRisk(userId: string): Promise<void> {
    try {
      const analysis = await this.fraud.analyzeUser(userId);
      if (analysis.recommendation !== "BLOCK") return;
      await this.escalate(userId, `Automated fraud check: risk score ${analysis.riskScore} (${analysis.flags.join(", ") || "no specific flags"})`);
    } catch (error) {
      logger.warn("checkUserRisk failed", { userId, error: error instanceof Error ? error.message : "unknown" });
    }
  }

  /** Run after a report is filed — checks whether the target has crossed a report-volume threshold. */
  async checkReportVolume(targetUserId: string): Promise<void> {
    try {
      const windowStart = new Date(Date.now() - REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const openReports = await this.prisma.report.count({
        where: { targetUserId, createdAt: { gte: windowStart }, status: { in: ["OPEN", "UNDER_REVIEW"] } },
      });
      if (openReports < REPORT_RESTRICT_THRESHOLD) return;
      await this.escalate(targetUserId, `Automated: ${openReports} reports in the last ${REPORT_WINDOW_DAYS} days`, openReports >= REPORT_SUSPEND_THRESHOLD);
    } catch (error) {
      logger.warn("checkReportVolume failed", { targetUserId, error: error instanceof Error ? error.message : "unknown" });
    }
  }

  private async escalate(targetUserId: string, reason: string, forceSuspend = false): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId }, select: { status: true } });
    if (!user || user.status === "BANNED") return;

    const systemId = await this.getSystemUserId();

    if (forceSuspend || user.status === "RESTRICTED" || user.status === "SUSPENDED") {
      if (user.status === "SUSPENDED") return;
      await this.moderation.suspendUser(systemId, targetUserId, reason, AUTO_SUSPEND_DAYS);
      logger.warn("Auto-suspended account", { targetUserId, reason });
      return;
    }

    await this.moderation.restrictUser(systemId, targetUserId, reason);
    logger.warn("Auto-restricted account", { targetUserId, reason });
  }

  private async getSystemUserId(): Promise<string> {
    if (this.systemUserId) return this.systemUserId;

    const existing = await this.prisma.user.findUnique({ where: { email: SYSTEM_ACCOUNT_EMAIL } });
    if (existing) {
      this.systemUserId = existing.id;
      return existing.id;
    }

    const created = await this.prisma.user.create({
      data: {
        username: "vibely-system",
        email: SYSTEM_ACCOUNT_EMAIL,
        // Random, never issued to anyone — this account cannot log in, it only
        // exists as the attributed actor on automated moderation actions.
        passwordHash: randomUUID(),
        dateOfBirth: new Date("2000-01-01"),
        gender: "PREFER_NOT_TO_SAY",
        country: "SYSTEM",
        language: "en",
        status: "ACTIVE",
        role: "SUPER_ADMIN",
        emailVerified: true,
      },
    });
    this.systemUserId = created.id;
    return created.id;
  }
}
