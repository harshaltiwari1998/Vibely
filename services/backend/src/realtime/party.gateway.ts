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
import { RealtimeEvent } from "@vibely/types";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import { PartyService } from "../modules/party/party.service";
import { createLogger } from "@vibely/shared";

const logger = createLogger("PartyGateway");

function roomKey(roomId: string): string {
  return `party:${roomId}`;
}

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/party" })
export class PartyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Namespace;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly party: PartyService,
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
      logger.warn("Party disconnect cleanup failed", {
        userId,
        roomId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  @SubscribeMessage("party_join")
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await client.join(roomKey(payload.roomId));
    client.data.roomId = payload.roomId;

    const memberCount = this.getMemberCount(payload.roomId);
    await this.party.updatePeakMembers(payload.roomId, memberCount);

    this.server.to(roomKey(payload.roomId)).emit(RealtimeEvent.PartyMemberJoined, {
      roomId: payload.roomId,
      userId,
      username: user.username,
      memberCount,
    });
  }

  @SubscribeMessage("party_leave")
  async handleLeave(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    await this.leaveRoom(client, payload.roomId, userId);
  }

  @SubscribeMessage("party_take_seat")
  async handleTakeSeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; seatIndex: number },
  ): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      const result = await this.party.takeSeat(payload.roomId, userId, payload.seatIndex);
      this.server.to(roomKey(payload.roomId)).emit(RealtimeEvent.PartySeatUpdated, {
        roomId: payload.roomId,
        seats: result.seats,
      });
      client.emit(RealtimeEvent.PartySeatToken, { roomId: payload.roomId, token: result.token });
    } catch (error) {
      logger.warn("Take seat failed", { userId, roomId: payload.roomId, error: error instanceof Error ? error.message : "unknown" });
    }
  }

  @SubscribeMessage("party_leave_seat")
  async handleLeaveSeat(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      const result = await this.party.leaveSeat(payload.roomId, userId);
      this.server.to(roomKey(payload.roomId)).emit(RealtimeEvent.PartySeatUpdated, {
        roomId: payload.roomId,
        seats: result.seats,
      });
    } catch (error) {
      logger.warn("Leave seat failed", { userId, roomId: payload.roomId, error: error instanceof Error ? error.message : "unknown" });
    }
  }

  @SubscribeMessage("party_toggle_mute")
  async handleToggleMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; muted: boolean },
  ): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      const result = await this.party.toggleMute(payload.roomId, userId, payload.muted);
      this.server.to(roomKey(payload.roomId)).emit(RealtimeEvent.PartySeatUpdated, {
        roomId: payload.roomId,
        seats: result.seats,
      });
    } catch (error) {
      logger.warn("Toggle mute failed", { userId, roomId: payload.roomId, error: error instanceof Error ? error.message : "unknown" });
    }
  }

  @SubscribeMessage(RealtimeEvent.PartyChatMessage)
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; content: string },
  ): Promise<void> {
    const userId = client.data?.userId;
    if (!userId || !payload.content?.trim()) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    this.server.to(roomKey(payload.roomId)).emit(RealtimeEvent.PartyChatMessage, {
      roomId: payload.roomId,
      userId,
      username: user.username,
      content: payload.content.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
    });
  }

  private async leaveRoom(client: Socket, roomId: string, userId: string): Promise<void> {
    await client.leave(roomKey(roomId));
    await this.party.leaveRoom(roomId, userId);

    const memberCount = this.getMemberCount(roomId);
    this.server.to(roomKey(roomId)).emit(RealtimeEvent.PartyMemberLeft, {
      roomId,
      userId,
      memberCount,
    });
    this.server.to(roomKey(roomId)).emit(RealtimeEvent.PartySeatUpdated, {
      roomId,
      seats: await this.party.getSeats(roomId),
    });
  }

  private getMemberCount(roomId: string): number {
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
