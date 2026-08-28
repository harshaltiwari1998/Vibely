import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RealtimeEvent } from "@vibely/types";
import { PresenceService } from "./presence.service";
import { createLogger } from "@vibely/shared";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import { MatchingService } from "../modules/matching/matching.service";
import { CallsService } from "../modules/calls/calls.service";
import { ChatService } from "../modules/chat/chat.service";
import { GiftsService } from "../modules/gifts/gifts.service";
import { NotificationsService } from "../modules/notifications/notifications.service";
import { DevicesService } from "../modules/devices/devices.service";

const logger = createLogger("RealtimeGateway");

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/" })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presence: PresenceService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
    private readonly calls: CallsService,
    private readonly chat: ChatService,
    private readonly gifts: GiftsService,
    private readonly notifications: NotificationsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(token, {
        secret: this.config.get<string>("app.jwtSecret"),
      }) as { sub: string };
    } catch {
      client.disconnect(true);
      return;
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === "BANNED" || user.status === "SUSPENDED") {
      client.disconnect(true);
      return;
    }
    client.data = { userId: payload.sub };
    await this.presence.markOnline(payload.sub, client.id);
    this.server.emit(RealtimeEvent.UserOnline, { userId: payload.sub });
    logger.debug("Client connected", { socketId: client.id, userId: payload.sub });
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data?.userId;
    if (userId) {
      await this.presence.markOffline(userId);
      this.server.emit(RealtimeEvent.UserOffline, { userId });
      await this.matching.handleDisconnect(userId);
      await this.endActiveCalls(userId);
    }
    logger.debug("Client disconnected", { socketId: client.id, userId });
  }

  @SubscribeMessage(RealtimeEvent.UserOnline)
  handleUserOnline(@ConnectedSocket() client: Socket, @MessageBody() _payload: { userId: string }): void {
    void client;
    void this.presence.markOnline(_payload.userId, client.id);
    this.server.emit(RealtimeEvent.UserOnline, { userId: _payload.userId });
  }

  @SubscribeMessage(RealtimeEvent.UserOffline)
  handleUserOffline(@MessageBody() _payload: { userId: string }): void {
    void this.presence.markOffline(_payload.userId);
    this.server.emit(RealtimeEvent.UserOffline, { userId: _payload.userId });
  }

  @SubscribeMessage("ping")
  handlePing(@ConnectedSocket() client: Socket): void {
    const userId = client.data?.userId;
    if (userId) {
      void this.presence.heartbeat(userId);
    }
  }

  @SubscribeMessage(RealtimeEvent.MatchStart)
  async handleMatchStart(@ConnectedSocket() client: Socket, @MessageBody() _payload: { preferredGender?: string; preferredAgeMin?: number; preferredAgeMax?: number }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      const result = await this.matching.requestMatch(userId, _payload);
      if (result.status === "MATCHED" && result.matchId) {
        client.emit(RealtimeEvent.MatchFound, { matchId: result.matchId, peerId: "", callType: "VIDEO" });
      }
    } catch {
      // ignore client errors
    }
  }

  @SubscribeMessage(RealtimeEvent.MatchCancel)
  async handleMatchCancel(@ConnectedSocket() client: Socket): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    await this.matching.cancelMatch(userId);
  }

  @SubscribeMessage(RealtimeEvent.MatchAccept)
  async handleMatchAccept(@ConnectedSocket() client: Socket, @MessageBody() body: { matchId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      const result = await this.matching.acceptMatch(userId, body.matchId);
      if (result.success && result.otherUserId) {
        const call = await this.calls.initiate(userId, result.otherUserId);
        this.server.to(userId).emit(RealtimeEvent.CallStarted, {
          callId: call.id,
          initiatorId: userId,
          receiverId: result.otherUserId,
          type: "VIDEO",
        });
        this.server.to(result.otherUserId).emit(RealtimeEvent.CallStarted, {
          callId: call.id,
          initiatorId: userId,
          receiverId: result.otherUserId,
          type: "VIDEO",
        });
      }
    } catch {
      // ignore
    }
  }

  @SubscribeMessage(RealtimeEvent.MatchDecline)
  async handleMatchDecline(@ConnectedSocket() client: Socket, @MessageBody() body: { matchId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      await this.matching.declineMatch(userId, body.matchId);
    } catch {
      // ignore
    }
  }

  @SubscribeMessage(RealtimeEvent.TypingStarted)
  async handleTypingStarted(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    const chat = await this.prisma.chat.findUnique({
      where: { id: payload.chatId },
    });
    if (!chat) return;
    const otherUserId = chat.participantOneId === userId ? chat.participantTwoId : chat.participantOneId;
    const targetSocketId = await this.presence.getSocketId(otherUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit(RealtimeEvent.TypingStarted, {
        chatId: payload.chatId,
        userId,
      });
    }
  }

  @SubscribeMessage(RealtimeEvent.TypingStopped)
  async handleTypingStopped(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    const chat = await this.prisma.chat.findUnique({
      where: { id: payload.chatId },
    });
    if (!chat) return;
    const otherUserId = chat.participantOneId === userId ? chat.participantTwoId : chat.participantOneId;
    const targetSocketId = await this.presence.getSocketId(otherUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit(RealtimeEvent.TypingStopped, {
        chatId: payload.chatId,
        userId,
      });
    }
  }

  @SubscribeMessage(RealtimeEvent.MessageSent)
  async handleMessageSent(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId: string; content: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      const message = await this.chat.sendMessage(userId, payload);
      const chat = await this.prisma.chat.findUnique({
        where: { id: payload.chatId },
      });
      if (!chat) return;
      const otherUserId = chat.participantOneId === userId ? chat.participantTwoId : chat.participantOneId;
      const targetSocketId = await this.presence.getSocketId(otherUserId);

      const messagePayload = {
        messageId: message.id,
        chatId: payload.chatId,
        senderId: userId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      };

      this.server.to(userId).emit(RealtimeEvent.MessageSent, messagePayload);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit(RealtimeEvent.MessageSent, messagePayload);
      }
    } catch {
      // ignore
    }
  }

  @SubscribeMessage(RealtimeEvent.GiftSent)
  async handleGiftSent(@ConnectedSocket() client: Socket, @MessageBody() payload: { receiverId: string; giftId: string }): Promise<void> {
    const senderId = client.data?.userId;
    if (!senderId) return;
    try {
      const result = await this.gifts.sendGift(senderId, payload);
      const gift = await this.prisma.gift.findUnique({ where: { id: payload.giftId } });
      const receiver = await this.prisma.user.findUnique({ where: { id: payload.receiverId } });
      const sender = await this.prisma.user.findUnique({ where: { id: senderId } });

      const giftPayload = {
        giftId: gift?.id ?? payload.giftId,
        giftName: gift?.name,
        iconUrl: gift?.iconUrl,
        senderId,
        senderName: sender?.username,
        coinAmount: result.coinAmount,
      };

      this.server.to(senderId).emit(RealtimeEvent.GiftSent, giftPayload);
      this.server.to(payload.receiverId).emit(RealtimeEvent.GiftReceived, giftPayload);
    } catch {
      // ignore
    }
  }

  @SubscribeMessage(RealtimeEvent.NotificationRead)
  async handleNotificationRead(@ConnectedSocket() client: Socket, @MessageBody() payload: { notificationId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      await this.notifications.markRead(userId, payload.notificationId);
    } catch {
      // ignore
    }
  }

  @SubscribeMessage(RealtimeEvent.NotificationDeleted)
  async handleNotificationDeleted(@ConnectedSocket() client: Socket, @MessageBody() payload: { notificationId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      await this.notifications.delete(userId, payload.notificationId);
    } catch {
      // ignore
    }
  }

  private async endActiveCalls(userId: string) {
    const activeCalls = await this.prisma.call.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
        status: { in: ["INITIATED", "RINGING", "ACTIVE"] },
      },
    });
    for (const call of activeCalls) {
      await this.calls.endCall(call.id, userId, "disconnected");
    }
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token as string | undefined;
    if (auth) return auth;
    const query = (client.handshake.query?.token as string | undefined);
    if (query) return query.replace(/^Bearer\s+/i, "").trim();
    const header = client.handshake.headers?.authorization as string | undefined;
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return null;
  }
}
