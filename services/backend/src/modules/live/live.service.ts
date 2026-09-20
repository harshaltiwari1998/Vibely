import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccessToken } from "livekit-server-sdk";
import { PrismaService } from "../../database/prisma.service";
import { createLogger } from "@vibely/shared";
import { StartLiveDto } from "@vibely/types";
import { LevelsService } from "../levels/levels.service";

const logger = createLogger("LiveService");

@Injectable()
export class LiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly levels: LevelsService,
  ) {}

  private async mintToken(roomId: string, userId: string, username: string, canPublish: boolean): Promise<string> {
    const apiKey = this.config.get<string>("app.liveKit.apiKey")!;
    const apiSecret = this.config.get<string>("app.liveKit.apiSecret")!;
    const token = new AccessToken(apiKey, apiSecret, { identity: userId, name: username });
    token.addGrant({ room: roomId, roomJoin: true, canPublish, canSubscribe: true });
    return token.toJwt();
  }

  async startLive(hostId: string, dto: StartLiveDto) {
    const existing = await this.prisma.liveRoom.findFirst({
      where: { hostId, status: "LIVE" },
    });
    if (existing) throw new BadRequestException("You already have an active live room");

    const host = await this.prisma.user.findUnique({ where: { id: hostId } });
    if (!host) throw new NotFoundException("Host not found");

    const room = await this.prisma.liveRoom.create({
      data: {
        hostId,
        title: dto.title,
        country: dto.country ?? host.country,
        coverUrl: dto.coverUrl,
        status: "LIVE",
      },
    });

    const token = await this.mintToken(room.id, hostId, host.username, true);
    await this.levels.awardXp(hostId, 20);
    logger.info("Live room started", { roomId: room.id, hostId });
    return { room, token, livekitUrl: this.config.get<string>("app.liveKit.url") };
  }

  async endLive(roomId: string, userId: string) {
    const room = await this.prisma.liveRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException("Live room not found");
    if (room.hostId !== userId) throw new ForbiddenException("Only the host can end this live");
    if (room.status === "ENDED") return room;

    const updated = await this.prisma.liveRoom.update({
      where: { id: roomId },
      data: { status: "ENDED", endedAt: new Date() },
    });
    await this.prisma.liveViewer.updateMany({
      where: { roomId, leftAt: null },
      data: { leftAt: new Date() },
    });

    logger.info("Live room ended", { roomId, userId });
    return updated;
  }

  async listActive(country?: string) {
    return this.prisma.liveRoom.findMany({
      where: { status: "LIVE", ...(country ? { country } : {}) },
      orderBy: { startedAt: "desc" },
      include: { host: { select: { id: true, username: true, avatarUrl: true } } },
    });
  }

  async getRoomForViewer(roomId: string, userId: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: { host: { select: { id: true, username: true, avatarUrl: true } } },
    });
    if (!room) throw new NotFoundException("Live room not found");
    if (room.status !== "LIVE") throw new BadRequestException("This live has ended");

    const viewer = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!viewer) throw new NotFoundException("Viewer not found");

    await this.prisma.liveViewer.create({
      data: { roomId, userId },
    });

    const token = await this.mintToken(roomId, userId, viewer.username, false);
    return { room, token, livekitUrl: this.config.get<string>("app.liveKit.url") };
  }

  async markViewerLeft(roomId: string, userId: string) {
    await this.prisma.liveViewer.updateMany({
      where: { roomId, userId, leftAt: null },
      data: { leftAt: new Date() },
    });
  }

  async updatePeakViewers(roomId: string, count: number): Promise<void> {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      select: { peakViewers: true },
    });
    if (room && count > room.peakViewers) {
      await this.prisma.liveRoom.update({ where: { id: roomId }, data: { peakViewers: count } });
    }
  }
}
