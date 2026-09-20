import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { RealtimeEvent, SendLiveGiftDto } from "@vibely/types";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import { LiveService } from "../modules/live/live.service";
import { GiftsService } from "../modules/gifts/gifts.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("LiveGateway");

function roomKey(roomId: string): string {
  return `live:${roomId}`;
}

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/live" })
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly live: LiveService,
    private readonly gifts: GiftsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get<string>("app.jwtSecret"),
      }) as { sub: string };
      client.data = { userId: payload.sub };
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const { userId, roomId } = client.data ?? {};
    if (!userId || !roomId) return;
    try {
      await this.leaveRoom(client, roomId, userId);
    } catch (error) {
      // handleDisconnect runs outside Nest's WsExceptionsHandler, so an
      // uncaught error here would crash the whole process.
      logger.warn("Live disconnect cleanup failed", {
        userId,
        roomId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  @SubscribeMessage("live_join")
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await client.join(roomKey(payload.roomId));
    client.data.roomId = payload.roomId;

    const viewerCount = this.getViewerCount(payload.roomId);
    await this.live.updatePeakViewers(payload.roomId, viewerCount);

    this.server.to(roomKey(payload.roomId)).emit(RealtimeEvent.LiveViewerJoined, {
      roomId: payload.roomId,
      userId,
      username: user.username,
      viewerCount,
    });
  }

  @SubscribeMessage("live_leave")
  async handleLeave(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    await this.leaveRoom(client, payload.roomId, userId);
  }

  @SubscribeMessage(RealtimeEvent.LiveChatMessage)
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; content: string },
  ): Promise<void> {
    const userId = client.data?.userId;
    if (!userId || !payload.content?.trim()) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    this.server.to(roomKey(payload.roomId)).emit(RealtimeEvent.LiveChatMessage, {
      roomId: payload.roomId,
      userId,
      username: user.username,
      content: payload.content.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage(RealtimeEvent.LiveGiftSent)
  async handleGiftSend(@ConnectedSocket() client: Socket, @MessageBody() payload: SendLiveGiftDto): Promise<void> {
    const senderId = client.data?.userId;
    if (!senderId) return;

    try {
      const room = await this.prisma.liveRoom.findUnique({ where: { id: payload.roomId } });
      if (!room || room.status !== "LIVE") return;

      const result = await this.gifts.sendGift(senderId, { receiverId: room.hostId, giftId: payload.giftId });

      this.server.to(roomKey(payload.roomId)).emit(RealtimeEvent.LiveGiftSent, {
        roomId: payload.roomId,
        giftId: result.gift.id,
        giftName: result.gift.name,
        iconUrl: result.gift.iconUrl,
        senderId,
        senderName: result.sender.username,
        coinAmount: result.coinAmount,
      });
    } catch (error) {
      logger.warn("Live gift send failed", {
        senderId,
        roomId: payload.roomId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  private async leaveRoom(client: Socket, roomId: string, userId: string): Promise<void> {
    await client.leave(roomKey(roomId));
    await this.live.markViewerLeft(roomId, userId);

    const viewerCount = this.getViewerCount(roomId);
    this.server.to(roomKey(roomId)).emit(RealtimeEvent.LiveViewerLeft, {
      roomId,
      userId,
      viewerCount,
    });
  }

  private getViewerCount(roomId: string): number {
    return this.server.adapter.rooms?.get(roomKey(roomId))?.size ?? 0;
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth?.token as string | undefined;
    if (auth) return auth.replace(/^Bearer\s+/i, "").trim();
    const query = client.handshake.query?.token as string | undefined;
    if (query) return query.replace(/^Bearer\s+/i, "").trim();
    const header = client.handshake.headers?.authorization as string | undefined;
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return null;
  }
}
