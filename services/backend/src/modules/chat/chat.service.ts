import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { RedisService } from "../../cache/redis.service";
import { RealtimeEvent } from "@vibely/types";
import { createLogger } from "@vibely/shared";

const logger = createLogger("ChatService");

const MESSAGE_MAX_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
    private readonly redis: RedisService,
  ) {}

  async listChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [{ participantOneId: userId }, { participantTwoId: userId }],
      },
      include: {
        participantOne: { select: { id: true, username: true, avatarUrl: true } },
        participantTwo: { select: { id: true, username: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return chats.map((chat) => {
      const peer = chat.participantOneId === userId ? chat.participantTwo : chat.participantOne;
      const lastMessage = chat.messages[0] ?? null;
      return {
        id: chat.id,
        peer,
        lastMessage,
        updatedAt: chat.updatedAt,
      };
    });
  }

  async getMessages(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participantOne: true,
        participantTwo: true,
      },
    });
    if (!chat) throw new NotFoundException("Chat not found");
    if (chat.participantOneId !== userId && chat.participantTwoId !== userId) {
      throw new ForbiddenException("Not a participant");
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return { items: messages, total: messages.length };
  }

  async sendMessage(userId: string, dto: { chatId: string; content: string }) {
    const { chatId, content } = dto;
    if (!content || !content.trim()) {
      throw new BadRequestException("Message content is required");
    }
    if (content.length > MESSAGE_MAX_LENGTH) {
      throw new BadRequestException(`Message exceeds max length of ${MESSAGE_MAX_LENGTH}`);
    }

    const rateKey = `chat:rate:${userId}`;
    const sent = await this.redis.incr(rateKey);
    if (sent === 1) {
      await this.redis.expire(rateKey, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
    }
    if (sent > RATE_LIMIT_MAX) {
      throw new BadRequestException("Rate limit exceeded. Please slow down.");
    }

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participantOne: true,
        participantTwo: true,
      },
    });
    if (!chat) throw new NotFoundException("Chat not found");
    if (chat.participantOneId !== userId && chat.participantTwoId !== userId) {
      throw new ForbiddenException("Not a participant");
    }

    const otherUserId = chat.participantOneId === userId ? chat.participantTwoId : chat.participantOneId;

    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { status: true },
    });
    if (otherUser && (otherUser.status === "BANNED" || otherUser.status === "SUSPENDED" || otherUser.status === "RESTRICTED")) {
      throw new ForbiddenException("User is unavailable");
    }

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });
    if (block) {
      throw new ForbiddenException("Cannot message this user");
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: content.trim(),
        type: "TEXT",
        status: "SENT",
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    const recipientSocketId = await this.gateway["presence"].getSocketId(otherUserId);
    const payload = {
      messageId: message.id,
      chatId,
      senderId: userId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };

    if (recipientSocketId) {
      this.gateway.server.to(recipientSocketId).emit(RealtimeEvent.MessageSent, payload);
      this.gateway.server.to(userId).emit(RealtimeEvent.MessageSent, payload);
      await this.prisma.message.update({
        where: { id: message.id },
        data: { status: "DELIVERED" },
      });
      this.gateway.server.to(userId).emit(RealtimeEvent.MessageDelivered, { messageId: message.id, chatId });
    } else {
      await this.createNotification(otherUserId, message);
    }

    logger.info("Message sent", { messageId: message.id, chatId, senderId: userId });
    return message;
  }

  async markDelivered(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true },
    });
    if (!message) return;
    if (message.chat.participantOneId !== userId && message.chat.participantTwoId !== userId) return;
    if (message.status === "DELIVERED" || message.status === "READ") return;

    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: "DELIVERED" },
    });

    this.gateway.server.to(message.senderId).emit(RealtimeEvent.MessageDelivered, { messageId, chatId: message.chatId });
  }

  async markRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true },
    });
    if (!message) return;
    if (message.chat.participantOneId !== userId && message.chat.participantTwoId !== userId) return;
    if (message.status === "READ") return;

    await this.prisma.message.update({
      where: { id: messageId },
      data: { status: "READ" },
    });

    this.gateway.server.to(message.senderId).emit(RealtimeEvent.MessageRead, { messageId, chatId: message.chatId, userId });
  }

  async reportMessage(messageId: string, reporterId: string, reason: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true, sender: true },
    });
    if (!message) throw new NotFoundException("Message not found");
    if (message.chat.participantOneId !== reporterId && message.chat.participantTwoId !== reporterId) {
      throw new ForbiddenException("Not a participant");
    }

    await this.prisma.report.create({
      data: {
        reporterId,
        targetUserId: message.senderId,
        targetType: "MESSAGE",
        targetId: messageId,
        reason: "SPAM",
        description: `Reported message ${messageId}`,
        status: "OPEN",
      },
    });

    logger.warn("Message reported", { messageId, reporterId, reason });
    return { success: true };
  }

  async blockUser(userId: string, targetUserId: string) {
    const existing = await this.prisma.block.findFirst({
      where: { blockerId: userId, blockedId: targetUserId },
    });
    if (existing) return { success: true };

    await this.prisma.block.create({
      data: { blockerId: userId, blockedId: targetUserId },
    });

    this.gateway.server.to(targetUserId).emit(RealtimeEvent.UserOffline, { userId });
    logger.info("User blocked", { blockerId: userId, blockedId: targetUserId });
    return { success: true };
  }

  async unblockUser(userId: string, targetUserId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerId: userId, blockedId: targetUserId },
    });
    return { success: true };
  }

  async reportUser(reporterId: string, reportedId: string, reason: string) {
    await this.prisma.report.create({
      data: {
        reporterId,
        targetUserId: reportedId,
        targetType: "USER",
        reason: "HARASSMENT",
        description: reason,
        status: "OPEN",
      },
    });

    logger.warn("User reported", { reporterId, reportedId, reason });
    return { success: true };
  }

  private async createNotification(userId: string, message: { id: string; content: string; senderId: string }) {
    const sender = await this.prisma.user.findUnique({
      where: { id: message.senderId },
      select: { username: true },
    });
    await this.prisma.notification.create({
      data: {
        userId,
        type: "MESSAGE",
        title: `New message from ${sender?.username ?? "someone"}`,
        body: message.content.slice(0, 120),
      },
    });
  }
}
