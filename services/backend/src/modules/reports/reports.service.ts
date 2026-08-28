import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Optional } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { ReportReason, ReportStatus, UserStatus } from "@prisma/client";
import { CreateReportDto, UpdateReportDto } from "@vibely/types";
import { createLogger, SECURITY, ageFromDateOfBirth } from "@vibely/shared";

const logger = createLogger("ReportsService");

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: RealtimeGateway,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException("Target user not found");
    }
    if (targetUser.id === reporterId) {
      throw new BadRequestException("Cannot report yourself");
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetUserId: dto.targetUserId,
        targetType: dto.targetType,
        targetId: dto.targetId || null,
        reason: dto.reason as ReportReason,
        description: dto.description || null,
        status: ReportStatus.OPEN,
      },
      include: {
        reporter: { select: { id: true, username: true } },
        targetUser: { select: { id: true, username: true, status: true } },
      },
    });

    logger.info("Report created", { reportId: report.id, reporterId, targetUserId: dto.targetUserId, reason: dto.reason });

    const recipientSocketId = await this.gateway?.["presence"].getSocketId(dto.targetUserId);
    if (recipientSocketId && this.gateway) {
      this.gateway.server.to(recipientSocketId).emit(RealtimeEvent.NotificationCreated, {
        notificationId: `report-${report.id}`,
        type: "REPORT_UPDATE",
        title: "You have been reported",
        body: `A report has been filed against you for: ${dto.reason}`,
      });
    }

    return report;
  }

  async list(query: { status?: string; page?: number; limit?: number; assignedToId?: string } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = {};
    if (query.status) where.status = query.status as ReportStatus;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

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

  async getReport(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { id: true, username: true, email: true } },
        targetUser: { select: { id: true, username: true, email: true, status: true } },
        assignedTo: { select: { id: true, username: true } },
      },
    });
    if (!report) throw new NotFoundException("Report not found");
    return report;
  }

  async updateReport(reportId: string, dto: UpdateReportDto, moderatorId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("Report not found");

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status as ReportStatus;
    if (dto.assignedToId !== undefined) updateData.assignedToId = dto.assignedToId;
    if (dto.internalNotes !== undefined) updateData.internalNotes = dto.internalNotes;
    if (dto.resolution !== undefined) updateData.resolution = dto.resolution;
    if (dto.status === "RESOLVED" || dto.status === "DISMISSED") {
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: updateData,
      include: {
        reporter: { select: { id: true, username: true } },
        targetUser: { select: { id: true, username: true } },
        assignedTo: { select: { id: true, username: true } },
      },
    });

    logger.info("Report updated", { reportId, moderatorId, status: dto.status });

    return updated;
  }

  async blockUser(blockerId: string, blockedId: string, expiresAt?: Date) {
    if (blockerId === blockedId) {
      throw new BadRequestException("Cannot block yourself");
    }
    const target = await this.prisma.user.findUnique({ where: { id: blockedId } });
    if (!target) throw new NotFoundException("User not found");

    const block = await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: { expiresAt: expiresAt || null },
      create: { blockerId, blockedId, expiresAt },
    });

    await this.prisma.favorite.deleteMany({
      where: {
        OR: [
          { ownerId: blockerId, targetUserId: blockedId },
          { ownerId: blockedId, targetUserId: blockerId },
        ],
      },
    });

    logger.info("User blocked", { blockerId, blockedId, expiresAt });
    return block;
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
    return { success: true };
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        blockerId,
        blockedId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    return block !== null;
  }

  async listBlocks(userId: string) {
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

  async listBlockedBy(userId: string) {
    return this.prisma.block.findMany({
      where: { blockedId: userId },
      include: {
        blocker: {
          select: { id: true, username: true, avatarUrl: true, country: true, language: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Enforce minimum-age registration/safety restrictions. */
  async enforceAgeRestriction(dateOfBirth: string): Promise<boolean> {
    const age = ageFromDateOfBirth(dateOfBirth);
    const ok = age >= SECURITY.MIN_AGE_YEARS && age <= SECURITY.MAX_AGE_YEARS;
    if (!ok) logger.warn("Age restriction failed", { age });
    return ok;
  }
}
