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
import { CallsService } from "../modules/calls/calls.service";
import { UnauthorizedException } from "@nestjs/common";

const logger = createLogger("SignalingGateway");

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/signal" })
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presence: PresenceService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly calls: CallsService,
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
    logger.debug("Signaling client connected", { socketId: client.id, userId: payload.sub });
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data?.userId;
    logger.debug("Signaling client disconnected", { socketId: client.id, userId });
  }

  @SubscribeMessage(RealtimeEvent.CallOffer)
  async handleOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: { callId: string; toUserId: string; sdp: unknown }): Promise<void> {
    const fromUserId = client.data?.userId;
    if (!fromUserId) return;
    const targetSocketId = await this.presence.getSocketId(payload.toUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit(RealtimeEvent.CallOffer, {
        ...payload,
        fromUserId,
      });
    }
  }

  @SubscribeMessage(RealtimeEvent.CallAnswer)
  async handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: { callId: string; toUserId: string; sdp: unknown }): Promise<void> {
    const fromUserId = client.data?.userId;
    if (!fromUserId) return;
    const targetSocketId = await this.presence.getSocketId(payload.toUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit(RealtimeEvent.CallAnswer, {
        ...payload,
        fromUserId,
      });
    }
  }

  @SubscribeMessage(RealtimeEvent.IceCandidate)
  async handleIce(@ConnectedSocket() client: Socket, @MessageBody() payload: { callId: string; toUserId: string; candidate: unknown }): Promise<void> {
    const fromUserId = client.data?.userId;
    if (!fromUserId) return;
    const targetSocketId = await this.presence.getSocketId(payload.toUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit(RealtimeEvent.IceCandidate, {
        ...payload,
        fromUserId,
      });
    }
  }

  @SubscribeMessage(RealtimeEvent.CallReady)
  async handleReady(@ConnectedSocket() client: Socket, @MessageBody() payload: { callId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    const call = await this.prisma.call.findUnique({
      where: { id: payload.callId },
    });
    if (!call) return;
    const otherUserId = call.initiatorId === userId ? call.receiverId : call.initiatorId;
    const targetSocketId = await this.presence.getSocketId(otherUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit(RealtimeEvent.CallReady, payload);
    }
  }

  @SubscribeMessage("call_end")
  async handleEnd(@ConnectedSocket() client: Socket, @MessageBody() payload: { callId: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      await this.calls.endCall(payload.callId, userId);
    } catch {
      // ignore
    }
  }

  @SubscribeMessage("call_failed")
  async handleFailed(@ConnectedSocket() client: Socket, @MessageBody() payload: { callId: string; reason?: string }): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) return;
    try {
      await this.calls.failCall(payload.callId, payload.reason);
    } catch {
      // ignore
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
