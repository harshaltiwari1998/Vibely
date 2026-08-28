import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../cache/redis.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RealtimeEvent } from "@vibely/types";
import { createLogger } from "@vibely/shared";

const logger = createLogger("CallsService");

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly gateway: RealtimeGateway,
  ) {}

  async initiate(initiatorId: string, receiverId: string) {
    if (initiatorId === receiverId) {
      throw new BadRequestException("Cannot call yourself");
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      include: { profile: true },
    });
    if (!receiver) throw new NotFoundException("Receiver not found");
    if (receiver.status === "BANNED" || receiver.status === "SUSPENDED" || receiver.status === "RESTRICTED") {
      throw new ForbiddenException("Receiver is unavailable");
    }
    if (receiver.profile?.onlineStatus === "IN_CALL" || receiver.profile?.onlineStatus === "BUSY") {
      throw new BadRequestException("Receiver is busy");
    }

    const initiatorBlock = await this.prisma.block.findFirst({
      where: { blockerId: initiatorId, blockedId: receiverId },
    });
    if (initiatorBlock) throw new ForbiddenException("You have blocked this user");

    const receiverBlock = await this.prisma.block.findFirst({
      where: { blockerId: receiverId, blockedId: initiatorId },
    });
    if (receiverBlock) throw new ForbiddenException("User has blocked you");

    const existingActive = await this.prisma.call.findFirst({
      where: {
        OR: [
          { initiatorId, status: { in: ["INITIATED", "RINGING", "ACTIVE"] } },
          { receiverId, status: { in: ["INITIATED", "RINGING", "ACTIVE"] } },
        ],
      },
    });
    if (existingActive) {
      throw new BadRequestException("Already in an active call");
    }

    const call = await this.prisma.call.create({
      data: {
        initiatorId,
        receiverId,
        status: "RINGING",
        type: "VIDEO",
      },
      include: {
        initiator: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    await this.prisma.callParticipant.create({
      data: { callId: call.id, userId: initiatorId },
    });
    await this.prisma.callParticipant.create({
      data: { callId: call.id, userId: receiverId },
    });

    this.gateway.server.to(receiverId).emit(RealtimeEvent.CallStarted, {
      callId: call.id,
      initiatorId,
      receiverId,
      type: "VIDEO",
    });

    logger.info("Call initiated", { callId: call.id, initiatorId, receiverId });
    return call;
  }

  async acceptCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { participants: true },
    });
    if (!call) throw new NotFoundException("Call not found");
    if (call.status !== "RINGING") throw new BadRequestException("Call not ringing");

    const isParticipant = call.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException("Not a participant");

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: "ACTIVE", startedAt: new Date() },
    });

    await this.prisma.callParticipant.updateMany({
      where: { callId, userId, leftAt: null },
      data: { joinedAt: new Date() },
    });

    this.gateway.server.emit(RealtimeEvent.CallReady, { callId });
    return updated;
  }

  async endCall(callId: string, userId: string, reason?: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });
    if (!call) throw new NotFoundException("Call not found");

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000);

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: "ENDED",
        endedAt,
        durationSeconds,
        endReason: reason ?? "ended",
      },
    });

    await this.prisma.callParticipant.updateMany({
      where: { callId, userId, leftAt: null },
      data: { leftAt: endedAt },
    });

    const otherUserId = call.initiatorId === userId ? call.receiverId : call.initiatorId;
    this.gateway.server.to(otherUserId).emit(RealtimeEvent.CallEnded, {
      callId,
      durationSeconds,
      reason,
    });
    this.gateway.server.emit(RealtimeEvent.CallEnded, {
      callId,
      durationSeconds,
      reason,
    });

    logger.info("Call ended", { callId, userId, durationSeconds, reason });
    return updated;
  }

  async rejectCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });
    if (!call) throw new NotFoundException("Call not found");
    if (call.status !== "RINGING") throw new BadRequestException("Call not ringing");

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: "REJECTED", endedAt: new Date() },
    });

    const otherUserId = call.initiatorId === userId ? call.receiverId : call.initiatorId;
    this.gateway.server.to(otherUserId).emit(RealtimeEvent.CallEnded, {
      callId,
      durationSeconds: 0,
      reason: "rejected",
    });

    return updated;
  }

  async failCall(callId: string, reason?: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });
    if (!call) return;

    await this.prisma.call.update({
      where: { id: callId },
      data: { status: "FAILED", endedAt: new Date(), endReason: reason ?? "failed" },
    });

    this.gateway.server.emit(RealtimeEvent.CallFailed, { callId, reason });
  }

  async listHistory(userId: string) {
    const calls = await this.prisma.call.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      orderBy: { startedAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        initiatorId: true,
        receiverId: true,
        startedAt: true,
        endedAt: true,
        durationSeconds: true,
        endReason: true,
        participants: {
          select: {
            userId: true,
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return { items: calls, total: calls.length };
  }

  async getCall(callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        initiator: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
    if (!call) throw new NotFoundException("Call not found");
    return call;
  }
}
