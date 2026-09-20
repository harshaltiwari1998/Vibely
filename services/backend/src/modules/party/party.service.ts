import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccessToken } from "livekit-server-sdk";
import { PrismaService } from "../../database/prisma.service";
import { createLogger } from "@vibely/shared";
import { StartPartyDto } from "@vibely/types";
import { LevelsService } from "../levels/levels.service";

const logger = createLogger("PartyService");

const MIN_SEATS = 4;
const MAX_SEATS = 12;

@Injectable()
export class PartyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly levels: LevelsService,
  ) {}

  private async mintToken(roomId: string, userId: string, username: string, canPublish: boolean): Promise<string> {
    const apiKey = this.config.get<string>("app.liveKit.apiKey")!;
    const apiSecret = this.config.get<string>("app.liveKit.apiSecret")!;
    const token = new AccessToken(apiKey, apiSecret, { identity: userId, name: username });
    token.addGrant({ room: `party:${roomId}`, roomJoin: true, canPublish, canSubscribe: true });
    return token.toJwt();
  }

  async startParty(hostId: string, dto: StartPartyDto) {
    const existing = await this.prisma.partyRoom.findFirst({
      where: { hostId, status: "ACTIVE" },
    });
    if (existing) throw new BadRequestException("You already have an active party room");

    const host = await this.prisma.user.findUnique({ where: { id: hostId } });
    if (!host) throw new NotFoundException("Host not found");

    const seatCount = Math.min(MAX_SEATS, Math.max(MIN_SEATS, dto.seatCount ?? 8));

    const room = await this.prisma.partyRoom.create({
      data: {
        hostId,
        title: dto.title,
        country: dto.country ?? host.country,
        coverUrl: dto.coverUrl,
        seatCount,
        status: "ACTIVE",
      },
    });

    await this.prisma.partyMember.create({
      data: { roomId: room.id, userId: hostId, seatIndex: 0 },
    });

    const token = await this.mintToken(room.id, hostId, host.username, true);
    await this.levels.awardXp(hostId, 10);
    logger.info("Party room started", { roomId: room.id, hostId });
    return { room, seats: await this.getSeats(room.id), token, livekitUrl: this.config.get<string>("app.liveKit.url") };
  }

  async endParty(roomId: string, userId: string) {
    const room = await this.prisma.partyRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException("Party room not found");
    if (room.hostId !== userId) throw new ForbiddenException("Only the host can end this party");
    if (room.status === "ENDED") return room;

    const updated = await this.prisma.partyRoom.update({
      where: { id: roomId },
      data: { status: "ENDED", endedAt: new Date() },
    });
    await this.prisma.partyMember.updateMany({
      where: { roomId, leftAt: null },
      data: { leftAt: new Date(), seatIndex: null },
    });

    logger.info("Party room ended", { roomId, userId });
    return updated;
  }

  async listActive(country?: string) {
    const rooms = await this.prisma.partyRoom.findMany({
      where: { status: "ACTIVE", ...(country ? { country } : {}) },
      orderBy: { startedAt: "desc" },
      include: { host: { select: { id: true, username: true, avatarUrl: true } } },
    });
    const counts = await this.prisma.partyMember.groupBy({
      by: ["roomId"],
      where: { roomId: { in: rooms.map((r) => r.id) }, leftAt: null },
      _count: { _all: true },
    });
    const countByRoom = new Map(counts.map((c) => [c.roomId, c._count._all]));
    return rooms.map((room) => ({ ...room, memberCount: countByRoom.get(room.id) ?? 0 }));
  }

  async joinRoom(roomId: string, userId: string) {
    const room = await this.prisma.partyRoom.findUnique({
      where: { id: roomId },
      include: { host: { select: { id: true, username: true, avatarUrl: true } } },
    });
    if (!room) throw new NotFoundException("Party room not found");
    if (room.status !== "ACTIVE") throw new BadRequestException("This party has ended");

    const member = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!member) throw new NotFoundException("User not found");

    const activeEntry = await this.prisma.partyMember.findFirst({
      where: { roomId, userId, leftAt: null },
    });
    if (!activeEntry) {
      await this.prisma.partyMember.create({ data: { roomId, userId } });
    }

    // A rejoin (e.g. the host navigating from "start" into their own room) must
    // keep publish rights if they already hold a seat, instead of silently
    // downgrading them to a listen-only token.
    const canPublish = activeEntry?.seatIndex != null;
    const token = await this.mintToken(roomId, userId, member.username, canPublish);
    return { room, seats: await this.getSeats(roomId), token, livekitUrl: this.config.get<string>("app.liveKit.url") };
  }

  async leaveRoom(roomId: string, userId: string) {
    await this.prisma.partyMember.updateMany({
      where: { roomId, userId, leftAt: null },
      data: { leftAt: new Date(), seatIndex: null },
    });
  }

  async takeSeat(roomId: string, userId: string, seatIndex: number) {
    const room = await this.prisma.partyRoom.findUnique({ where: { id: roomId } });
    if (!room || room.status !== "ACTIVE") throw new NotFoundException("Party room not found");
    if (seatIndex < 0 || seatIndex >= room.seatCount) throw new BadRequestException("Invalid seat");

    const membership = await this.prisma.partyMember.findFirst({ where: { roomId, userId, leftAt: null } });
    if (!membership) throw new BadRequestException("Join the room before taking a seat");

    const occupied = await this.prisma.partyMember.findFirst({ where: { roomId, seatIndex, leftAt: null } });
    if (occupied && occupied.userId !== userId) throw new BadRequestException("Seat is already taken");

    await this.prisma.partyMember.update({ where: { id: membership.id }, data: { seatIndex, muted: false } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const token = await this.mintToken(roomId, userId, user!.username, true);
    return { seats: await this.getSeats(roomId), token };
  }

  async leaveSeat(roomId: string, userId: string) {
    const membership = await this.prisma.partyMember.findFirst({ where: { roomId, userId, leftAt: null } });
    if (!membership) throw new BadRequestException("Not a member of this room");
    await this.prisma.partyMember.update({ where: { id: membership.id }, data: { seatIndex: null, muted: false } });
    return { seats: await this.getSeats(roomId) };
  }

  async toggleMute(roomId: string, userId: string, muted: boolean) {
    const membership = await this.prisma.partyMember.findFirst({ where: { roomId, userId, leftAt: null, seatIndex: { not: null } } });
    if (!membership) throw new BadRequestException("You must be seated to toggle mute");
    await this.prisma.partyMember.update({ where: { id: membership.id }, data: { muted } });
    return { seats: await this.getSeats(roomId) };
  }

  async getSeats(roomId: string) {
    const occupied = await this.prisma.partyMember.findMany({
      where: { roomId, leftAt: null, seatIndex: { not: null } },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { seatIndex: "asc" },
    });
    return occupied.map((m) => ({
      seatIndex: m.seatIndex!,
      userId: m.userId,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      muted: m.muted,
    }));
  }

  async updatePeakMembers(roomId: string, count: number): Promise<void> {
    const room = await this.prisma.partyRoom.findUnique({ where: { id: roomId }, select: { peakMembers: true } });
    if (room && count > room.peakMembers) {
      await this.prisma.partyRoom.update({ where: { id: roomId }, data: { peakMembers: count } });
    }
  }
}
